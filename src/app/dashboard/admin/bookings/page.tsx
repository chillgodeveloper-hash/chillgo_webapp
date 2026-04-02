'use client';

import { redirect } from 'next/navigation';

export default function PendingBookingsPage() {
  redirect('/dashboard/admin/bookings?filter=pending');
}
