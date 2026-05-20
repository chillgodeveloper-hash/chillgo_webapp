import { NextRequest, NextResponse } from 'next/server';
import { stripe, createPaymentIntent } from '@/lib/stripe';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, total_price, status, customer_id, stripe_payment_intent_id')
      .eq('id', bookingId)
      .eq('customer_id', session.user.id)
      .eq('status', 'confirmed')
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or not confirmed' }, { status: 404 });
    }

    if (!booking.total_price || booking.total_price <= 0) {
      return NextResponse.json({ error: 'Invalid booking amount' }, { status: 400 });
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
        const expectedAmount = Math.round(booking.total_price * 100);
        if (
          (existingPI.status === 'requires_payment_method' || existingPI.status === 'requires_confirmation')
          && existingPI.amount === expectedAmount
        ) {
          return NextResponse.json({
            clientSecret: existingPI.client_secret,
            paymentIntentId: existingPI.id,
          });
        }
      } catch {}
    }

    const paymentIntent = await createPaymentIntent(booking.total_price, bookingId, customerEmail);

    // Service role bypasses RLS — earlier this used the user's session and any
    // policy/trigger quirk would make the update silently no-op, leaving the
    // booking without a PI ID. Verify then can't find it and the receipt page
    // hangs on "กำลังสร้างใบเสร็จ".
    const admin = createServiceRoleClient();
    const { error: updateErr } = await admin
      .from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', bookingId);
    if (updateErr) {
      console.error('[payments] failed to save PI id', updateErr);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
