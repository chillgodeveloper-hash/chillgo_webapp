import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

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
    const { bookingId, paymentIntentId, paymentMethod } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('receipts')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ receipt: existing });
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, post:posts!bookings_post_id_fkey(title)')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

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

    const receiptData = {
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
      payment_method: paymentMethod || 'card',
      stripe_payment_intent_id: paymentIntentId || booking.stripe_payment_intent_id || '',
      status: 'paid',
    };

    const { data: receipt, error } = await supabase
      .from('receipts')
      .insert(receiptData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const { data: existing2 } = await supabase
          .from('receipts')
          .select('*')
          .eq('booking_id', bookingId)
          .maybeSingle();
        return NextResponse.json({ receipt: existing2 });
      }
      throw error;
    }

    return NextResponse.json({ receipt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
