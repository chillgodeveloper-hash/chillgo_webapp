import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase-server';

// Server-side fallback for the Stripe webhook. The pay page calls this right
// after a successful confirm so that booking.status flips to 'paid' and the
// receipt row exists *synchronously* — without it, a misconfigured webhook
// (wrong secret, wrong URL, env not set) leaves the UI stuck with a "pay"
// button and a never-loading receipt page.
//
// Idempotent: re-runs are no-ops because we gate the booking update on
// status != 'paid' and the receipt insert on a duplicate-key error.

function generateReceiptNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CG${y}${m}${d}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('*, post:posts!bookings_post_id_fkey(title)')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'booking not found' }, { status: 404 });
    }

    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json({ verified: false, reason: 'no payment intent', status: booking.status });
    }

    // Source of truth: Stripe. Even if the webhook didn't fire, this tells us
    // whether the money actually moved.
    const pi = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ verified: false, paymentStatus: pi.status, status: booking.status });
    }

    // Flip booking to paid only on the first verify (.neq filter makes this
    // a noop if the webhook beat us to it).
    if (booking.status !== 'paid') {
      await supabase
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', bookingId)
        .neq('status', 'paid');
    }

    // Ensure a receipt exists.
    const { data: existing } = await supabase
      .from('receipts')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    let receipt = existing;
    if (!existing) {
      const [{ data: customer }, { data: partner }] = await Promise.all([
        supabase.from('profiles').select('full_name, email').eq('id', booking.customer_id).single(),
        supabase.from('profiles').select('full_name, email').eq('id', booking.partner_id).single(),
      ]);

      const { data: inserted, error: insErr } = await supabase
        .from('receipts')
        .insert({
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
          payment_method: pi.payment_method_types?.[0] || 'card',
          stripe_payment_intent_id: pi.id,
          status: 'paid',
        })
        .select()
        .single();

      // 23505 = unique violation, means the webhook just inserted it — fetch it.
      if (insErr && insErr.code === '23505') {
        const { data: justInserted } = await supabase
          .from('receipts').select('*').eq('booking_id', bookingId).single();
        receipt = justInserted;
      } else if (insErr) {
        console.error('verify: receipt insert error', { code: insErr.code, message: insErr.message, details: insErr.details, hint: insErr.hint });
        return NextResponse.json({
          verified: true,
          status: 'paid',
          receipt: null,
          receiptError: { code: insErr.code, message: insErr.message },
        });
      } else {
        receipt = inserted;
      }
    }

    return NextResponse.json({ verified: true, status: 'paid', receipt });
  } catch (err: any) {
    console.error('verify endpoint error:', err);
    return NextResponse.json({ error: err.message || 'verify failed' }, { status: 500 });
  }
}
