import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase-server';

// Receipts are authoritatively created by the Stripe webhook.
// This endpoint is a fallback used by the pay page after a successful confirm,
// in case the webhook is delayed. It is idempotent and only returns receipts
// for the calling customer.
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

    // Ensure caller owns the booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, customer_id')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.customer_id !== session.user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Just return whatever receipt exists (webhook creates it).
    // Bypass RLS for the lookup so we don't depend on user policy quirks.
    const admin = createServiceRoleClient();
    const { data: existing } = await admin
      .from('receipts')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    return NextResponse.json({ receipt: existing || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
