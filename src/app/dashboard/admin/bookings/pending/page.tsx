'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingBookingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/admin/bookings?filter=pending');
  }, [router]);
  return null;
}
