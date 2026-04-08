import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        await supabase
          .from('bookings')
          .update({ status: 'paid', stripe_payment_intent_id: paymentIntent.id })
          .eq('id', bookingId);

        const { data: booking } = await supabase
          .from('bookings')
          .select('*, post:posts!bookings_post_id_fkey(title)')
          .eq('id', bookingId)
          .single();

        if (booking) {
          const { data: customer } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', booking.customer_id)
            .single();

          const { data: partner } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', booking.partner_id)
            .single();

          let paymentMethodType = 'card';
          if (paymentIntent.payment_method) {
            try {
              const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
              paymentMethodType = pm.type || 'card';
            } catch {}
          }

          const { data: existingReceipt } = await supabase
            .from('receipts')
            .select('id')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (!existingReceipt) {
            const receiptNumber = generateReceiptNumber();

            await supabase.from('receipts').insert({
              booking_id: bookingId,
              receipt_number: receiptNumber,
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
              link: `/chat/${bookingId}`,
            },
          ]);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('customer_id, post:posts!bookings_post_id_fkey(title)')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await supabase.from('notifications').insert({
            user_id: booking.customer_id,
            title: 'การชำระเงินล้มเหลว',
            message: `การชำระเงินสำหรับ "${booking.post?.title || 'บริการ'}" ไม่สำเร็จ กรุณาลองใหม่`,
            type: 'payment',
            link: `/booking/${bookingId}/pay`,
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
