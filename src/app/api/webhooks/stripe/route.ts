import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

function generateReceiptNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CG${y}${m}${d}-${rand}`;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Idempotency guard — dedupe by Stripe event id.
  // PK conflict on stripe_events.id means this event was already processed.
  const { error: insertEventErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });

  if (insertEventErr) {
    if (insertEventErr.code === '23505') {
      return NextResponse.json({ received: true, deduped: true });
    }
    return NextResponse.json({ error: insertEventErr.message }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;
        if (!bookingId) break;

        // .neq('status','paid') gates the update so a second runner (e.g. the
        // sync verify endpoint already flipped it) returns no rows here, and
        // we skip the notifications/receipt path below to avoid duplicates.
        const { data: booking } = await supabase
          .from('bookings')
          .update({ status: 'paid', stripe_payment_intent_id: paymentIntent.id })
          .eq('id', bookingId)
          .neq('status', 'paid')
          .select('*, post:posts!bookings_post_id_fkey(title)')
          .maybeSingle();

        if (!booking) break;

        // Parallel profile fetch. (Stripe paymentMethods.retrieve removed — was a
        // 300-500ms extra round-trip just to label the receipt. The PI already
        // tells us which payment_method_types are allowed.)
        const [{ data: customer }, { data: partner }] = await Promise.all([
          supabase.from('profiles').select('full_name, email').eq('id', booking.customer_id).single(),
          supabase.from('profiles').select('full_name, email').eq('id', booking.partner_id).single(),
        ]);

        const paymentMethodType = paymentIntent.payment_method_types?.[0] || 'card';

        // Single INSERT — let the unique constraint on booking_id reject duplicates.
        // (Was SELECT-then-INSERT, two round-trips for the common no-conflict case.)
        const { error: receiptErr } = await supabase.from('receipts').insert({
          booking_id: bookingId,
          receipt_number: generateReceiptNumber(),
          customer_id: booking.customer_id,
          partner_id: booking.partner_id,
          customer_name: customer?.full_name || '',
          customer_email: customer?.email || '',
          partner_name: partner?.full_name || '',
          partner_email: partner?.email || '',
          service_title: booking.post?.title || '',
          booking_date: booking.booking_date,
          booking_end_date: booking.booking_end_date,
          guests: booking.guests,
          amount: booking.total_price || 0,
          payment_method: paymentMethodType,
          stripe_payment_intent_id: paymentIntent.id,
          status: 'paid',
        });
        if (receiptErr && receiptErr.code !== '23505') {
          console.error('Receipt insert error:', receiptErr);
        }

        const serviceName = booking.post?.title || 'บริการ';

        await supabase.from('notifications').insert([
          {
            user_id: booking.customer_id,
            title: 'ชำระเงินสำเร็จ',
            message: `การจอง "${serviceName}" ชำระเงินเรียบร้อยแล้ว ดูใบเสร็จได้ที่หน้าการจอง`,
            type: 'payment',
            link: `/booking/${bookingId}/receipt`,
          },
          {
            user_id: booking.partner_id,
            title: 'ได้รับการชำระเงิน',
            message: `${customer?.full_name || 'ลูกค้า'} ชำระเงินสำหรับ "${serviceName}" แล้ว`,
            type: 'payment',
            link: `/chat/${bookingId}/${booking.customer_id}`,
          },
        ]);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;
        if (!bookingId) break;

        const { data: bookingRaw } = await supabase
          .from('bookings')
          .select('customer_id, post:posts!bookings_post_id_fkey(title)')
          .eq('id', bookingId)
          .single();
        const booking = bookingRaw as any;

        if (booking) {
          await supabase.from('notifications').insert({
            user_id: booking.customer_id,
            title: 'การชำระเงินล้มเหลว',
            message: `การชำระเงินสำหรับ "${booking.post?.title || 'บริการ'}" ไม่สำเร็จ กรุณาลองใหม่`,
            type: 'payment',
            link: `/booking/${bookingId}/pay`,
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
        if (!paymentIntentId) break;

        const { data: bookingRaw } = await supabase
          .from('bookings')
          .select('id, customer_id, partner_id, post:posts!bookings_post_id_fkey(title)')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();
        const booking = bookingRaw as any;

        if (booking) {
          await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
          await supabase.from('notifications').insert([
            {
              user_id: booking.customer_id,
              title: 'การชำระเงินถูกคืน',
              message: `เงินสำหรับ "${booking.post?.title || 'บริการ'}" ถูกคืนเรียบร้อยแล้ว`,
              type: 'payment',
              link: `/booking/${booking.id}`,
            },
            {
              user_id: booking.partner_id,
              title: 'การจองถูกยกเลิก',
              message: `การจอง "${booking.post?.title || 'บริการ'}" ถูกคืนเงินและยกเลิก`,
              type: 'booking',
              link: '/booking',
            },
          ]);
        }
        break;
      }
    }
  } catch (err: any) {
    // Roll back the dedupe record so Stripe will retry
    await supabase.from('stripe_events').delete().eq('id', event.id);
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
