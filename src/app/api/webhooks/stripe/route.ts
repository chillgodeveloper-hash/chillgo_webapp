import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

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
          .select('customer_id, partner_id, post:posts(title)')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await supabase.from('notifications').insert([
            {
              user_id: booking.customer_id,
              title: 'ชำระเงินสำเร็จ',
              message: `การจอง "${booking.post?.title}" ชำระเงินเรียบร้อยแล้ว`,
              type: 'payment',
              link: `/booking`,
            },
            {
              user_id: booking.partner_id,
              title: 'ได้รับการชำระเงิน',
              message: `ลูกค้าชำระเงินสำหรับ "${booking.post?.title}" แล้ว`,
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
          .select('customer_id, post:posts(title)')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await supabase.from('notifications').insert({
            user_id: booking.customer_id,
            title: 'การชำระเงินล้มเหลว',
            message: `การชำระเงินสำหรับ "${booking.post?.title}" ไม่สำเร็จ กรุณาลองใหม่`,
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
