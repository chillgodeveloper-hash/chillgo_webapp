'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { Calendar, Clock, MapPin, MessageCircle, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Booking } from '@/types';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'อนุมัติแล้ว', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  alternative_offered: { label: 'มีตัวเลือกใหม่', color: 'bg-purple-100 text-purple-700', icon: AlertCircle },
  confirmed: { label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  paid: { label: 'ชำระเงินแล้ว', color: 'bg-emerald-100 text-emerald-700', icon: CreditCard },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'เสร็จสิ้น', color: 'bg-gray-100 text-tmuted', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-600', icon: XCircle },
};

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          post:posts(*),
          partner:partner_profiles(*, profile:profiles(*))
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      setBookings(data || []);
      setLoading(false);
    };
    fetchBookings();
  }, [user]);

  const activeBookings = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
  const completedBookings = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));
  const displayBookings = activeTab === 'active' ? activeBookings : completedBookings;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 lg:px-0">
        <h1 className="text-2xl font-bold text-tmain mb-4 hidden lg:block">การจองของฉัน</h1>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === 'active' ? 'bg-primary text-dark-DEFAULT font-semibold shadow-sm' : 'bg-primary-light text-gray-700 border border-primary/30'
            }`}
          >
            กำลังดำเนินการ ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === 'completed' ? 'bg-gray-800 text-white font-semibold shadow-sm' : 'bg-primary-light text-gray-700 border border-primary/30'
            }`}
          >
            เสร็จสิ้น ({completedBookings.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="w-2/3 h-5 bg-gray-200 rounded mb-3" />
                <div className="w-1/2 h-4 bg-gray-200 rounded mb-2" />
                <div className="w-1/3 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-tmuted">ยังไม่มีรายการจอง</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBookings.map((booking) => {
              const status = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <div key={booking.id} className="bg-white rounded-2xl p-4 border border-primary-dark/20 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-tmain">{booking.post?.title}</h3>
                      <p className="text-sm text-tmuted">{booking.partner?.profile?.full_name}</p>
                    </div>
                    <span className={`${status.color} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                      <StatusIcon size={12} /> {status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-tmuted mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(booking.booking_date).toLocaleDateString('th-TH')}
                    </span>
                    {booking.post?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {booking.post.location}
                      </span>
                    )}
                  </div>

                  {booking.total_price && (
                    <p className="text-secondary font-bold mb-3">฿{booking.total_price.toLocaleString()}</p>
                  )}

                  {booking.admin_note && (
                    <div className="bg-primary-light rounded-xl p-3 mb-3">
                      <p className="text-xs font-medium text-tmuted mb-1">หมายเหตุจาก Admin</p>
                      <p className="text-sm text-gray-700">{booking.admin_note}</p>
                    </div>
                  )}

                  {booking.status === 'alternative_offered' && booking.alternative_post && (
                    <div className="bg-purple/10 rounded-xl p-3 mb-3">
                      <p className="text-xs font-medium text-purple mb-1">ตัวเลือกที่แนะนำ</p>
                      <p className="text-sm font-semibold text-tmain">{booking.alternative_post.title}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={async () => {
                            await supabase
                              .from('bookings')
                              .update({ post_id: booking.alternative_post_id, status: 'confirmed' })
                              .eq('id', booking.id);
                            window.location.reload();
                          }}
                          className="bg-success text-white px-4 py-1.5 rounded-lg text-xs font-medium"
                        >
                          ยอมรับ
                        </button>
                        <button
                          onClick={async () => {
                            await supabase
                              .from('bookings')
                              .update({ status: 'cancelled' })
                              .eq('id', booking.id);
                            window.location.reload();
                          }}
                          className="bg-gray-200 text-tmuted px-4 py-1.5 rounded-lg text-xs font-medium"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-primary-dark/15">
                    {['confirmed', 'paid', 'in_progress'].includes(booking.status) && (
                      <Link
                        href={`/chat/${booking.id}`}
                        className="flex-1 bg-info/10 text-info font-medium py-2 rounded-xl text-sm text-center flex items-center justify-center gap-1.5 hover:bg-info/20 transition"
                      >
                        <MessageCircle size={16} /> แชท
                      </Link>
                    )}
                    {booking.status === 'confirmed' && (
                      <Link
                        href={`/booking/${booking.id}/pay`}
                        className="flex-1 bg-primary hover:bg-primary-dark text-dark-DEFAULT font-medium py-2 rounded-xl text-sm text-center flex items-center justify-center gap-1.5 transition"
                      >
                        <CreditCard size={16} /> ชำระเงิน
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
