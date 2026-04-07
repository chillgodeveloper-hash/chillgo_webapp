'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { Search, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Booking } from '@/types';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const supabase = createClient();

  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(*),
        partner:partner_profiles(*, profile:profiles(*)),
        post:posts(*)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleApprove = async (id: string) => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
    fetchBookings();
  };

  const handleReject = async (id: string) => {
    const reason = prompt('เหตุผล:');
    if (reason === null) return;
    await supabase.from('bookings').update({ status: 'cancelled', admin_note: reason }).eq('id', id);
    fetchBookings();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: 'รออนุมัติ', cls: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'ยืนยัน', cls: 'bg-green-100 text-green-700' },
      paid: { label: 'ชำระแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
      in_progress: { label: 'ดำเนินการ', cls: 'bg-blue-100 text-blue-700' },
      completed: { label: 'เสร็จ', cls: 'bg-primary/20 text-tmuted' },
      cancelled: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-600' },
      alternative_offered: { label: 'เสนอทางเลือก', cls: 'bg-purple-100 text-purple-700' },
    };
    const s = map[status] || map.pending;
    return <span className={`${s.cls} px-2.5 py-0.5 rounded-full text-xs font-medium`}>{s.label}</span>;
  };

  const filters = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'pending', label: 'รออนุมัติ' },
    { value: 'confirmed', label: 'ยืนยัน' },
    { value: 'paid', label: 'ชำระแล้ว' },
    { value: 'completed', label: 'เสร็จ' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 lg:px-0 py-6 lg:py-8">
        <h1 className="text-2xl font-bold text-tmain mb-6">รายการจองทั้งหมด</h1>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                filter === f.value ? 'bg-dark-DEFAULT text-primary' : 'bg-primary-light text-tmain border border-primary-dark/20 hover:bg-primary/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-primary/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-tmuted">ไม่พบรายการ</div>
          ) : (
            <div className="divide-y divide-primary-dark/10">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-primary-light/50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-tmain">{booking.post?.title}</p>
                      <p className="text-xs text-tmuted mt-0.5">
                        {booking.customer?.full_name} → {booking.partner?.profile?.full_name}
                      </p>
                    </div>
                    {statusBadge(booking.status)}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-tmuted mb-2">
                    <span>📅 {new Date(booking.booking_date).toLocaleDateString('th-TH')}</span>
                    <span>👥 {booking.guests} คน</span>
                    {booking.total_price && (
                      <span className="text-secondary font-medium">฿{booking.total_price.toLocaleString()}</span>
                    )}
                  </div>
                  {booking.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="flex items-center gap-1 bg-success/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        <CheckCircle size={14} /> อนุมัติ
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        className="flex items-center gap-1 bg-danger/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        <XCircle size={14} /> ปฏิเสธ
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
