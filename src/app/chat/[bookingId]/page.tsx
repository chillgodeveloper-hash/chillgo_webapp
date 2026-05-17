'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Backwards-compat shim: old links/notifications point at /chat/[bookingId]
// without a counterpart. Resolve the natural counterpart for the current
// user's role and forward them to the new 1:1 room URL.
export default function ChatBookingRedirect() {
  const { bookingId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!bookingId || !user) return;

    (async () => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('customer_id, partner_id')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        router.replace('/chat');
        return;
      }

      let counterpart: string | null = null;
      if (user.id === booking.customer_id) counterpart = booking.partner_id;
      else if (user.id === booking.partner_id) counterpart = booking.customer_id;
      else counterpart = booking.customer_id; // admin defaults to chatting with customer

      router.replace(counterpart ? `/chat/${bookingId}/${counterpart}` : '/chat');
    })();
  }, [bookingId, user]);

  return (
    <AppLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="text-secondary animate-spin" />
      </div>
    </AppLayout>
  );
}
