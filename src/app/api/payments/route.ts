import { NextRequest, NextResponse } from 'next/server';
import { stripe, createPaymentIntent } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount } = await request.json();

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('customer_id', session.user.id)
      .eq('status', 'confirmed')
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or not confirmed' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', session.user.id)
      .single();

    const customerEmail = profile?.email || session.user.email || '';

    if (booking.stripe_payment_intent_id) {
      try {
        const existingPI = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        if (existingPI.status === 'requires_payment_method' || existingPI.status === 'requires_confirmation') {
          return NextResponse.json({
            clientSecret: existingPI.client_secret,
            paymentIntentId: existingPI.id,
          });
        }
      } catch {}
    }

    const paymentIntent = await createPaymentIntent(amount, bookingId, customerEmail);

    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', bookingId);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
