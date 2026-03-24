'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import {
  Users, Briefcase, DollarSign, Clock, TrendingUp,
  CheckCircle, XCircle, AlertCircle, ChevronRight,
  Eye, UserCheck, Ban
} from 'lucide-react';
import { Booking, Post } from '@/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPartners: 0,
    activeJobs: 0,
    revenue: 0,
    pendingApprovals: 0,
  });
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [recentActivity, setRecentActivity] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    setLoading(true);

    const { count: partnerCount } = await supabase
      .from('partner_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'paid', 'in_progress']);

    const { data: paidBookings } = await supabase
      .from('bookings')
      .select('total_price')
      .in('status', ['paid', 'completed']);

    const revenue = paidBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: pending } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(*),
        partner:partner_profiles(*, profile:profiles(*)),
        post:posts(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recent } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(*),
        partner:partner_profiles(*, profile:profiles(*)),
        post:posts(*)
      `)
      .order('updated_at', { ascending: false })
      .limit(10);

    setStats({
      totalPartners: partnerCount || 0,
      activeJobs: activeCount || 0,
      revenue,
      pendingApprovals: pendingCount || 0,
    });
    setPendingBookings(pending || []);
    setRecentActivity(recent || []);
    setLoading(false);
  };

  const handleApprove = async (bookingId: string) => {
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);
    fetchDashboard();
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt('เหตุผลในการปฏิเสธ:');
    if (reason === null) return;
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', admin_note: reason })
      .eq('id', bookingId);
    fetchDashboard();
  };

  const handleOfferAlternative = async (booking: Booking) => {
    const postId = prompt('ใส่ Post ID ของตัวเลือกใหม่:');
    if (!postId) return;
    const note = prompt('หมายเหตุถึงลูกค้า:') || '';
    await supabase
      .from('bookings')
      .update({
        status: 'alternative_offered',
        alternative_post_id: postId,
        admin_note: note,
      })
      .eq('id', booking.id);
    fetchDashboard();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: 'รออนุมัติ', cls: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'อนุมัติแล้ว', cls: 'bg-blue-100 text-blue-700' },
      alternative_offered: { label: 'เสนอทางเลือก', cls: 'bg-purple-100 text-purple-700' },
      confirmed: { label: 'ยืนยันแล้ว', cls: 'bg-green-100 text-green-700' },
      paid: { label: 'ชำระแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
      in_progress: { label: 'กำลังดำเนินการ', cls: 'bg-blue-100 text-blue-700' },
      completed: { label: 'เสร็จสิ้น', cls: 'bg-primary/20 text-tmuted' },
      cancelled: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-600' },
    };
    const s = map[status] || map.pending;
    return <span className={`${s.cls} px-2.5 py-0.5 rounded-full text-xs font-medium`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="w-8 h-8 bg-primary-dark/30 rounded-lg mb-3" />
                <div className="w-16 h-8 bg-primary-dark/30 rounded mb-2" />
                <div className="w-24 h-4 bg-primary-dark/30 rounded" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 lg:px-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-tmain font-display">#ChillGo</h1>
            <p className="text-sm text-tmuted">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-text">{user?.full_name?.charAt(0)}</span>
            </div>
            <span className="text-sm font-medium text-tmain hidden lg:inline">Admin</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-primary/15 shadow-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-3">
              <Users size={20} className="text-primary-text" />
            </div>
            <p className="text-2xl font-bold text-tmain">{stats.totalPartners.toLocaleString()}</p>
            <p className="text-xs text-tmuted mt-0.5">Total Partners</p>
            <p className="text-xs text-success flex items-center gap-0.5 mt-1">
              <TrendingUp size={10} /> Growth
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-primary/15 shadow-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Briefcase size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-tmain">{stats.activeJobs}</p>
            <p className="text-xs text-tmuted mt-0.5">Active Jobs</p>
            <p className="text-xs text-success flex items-center gap-0.5 mt-1">
              <TrendingUp size={10} /> Growth
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-primary/15 shadow-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-tmain">฿{(stats.revenue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-tmuted mt-0.5">Revenue</p>
            <p className="text-xs text-success flex items-center gap-0.5 mt-1">
              <TrendingUp size={10} /> Growth
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-primary/15 shadow-sm hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <Clock size={20} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-tmain">{stats.pendingApprovals}</p>
            <p className="text-xs text-tmuted mt-0.5">Pending Approval</p>
            <p className="text-xs text-success flex items-center gap-0.5 mt-1">
              <TrendingUp size={10} /> Growth
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-primary-dark/20 shadow-sm">
              <div className="p-5 border-b border-primary-dark/15 flex items-center justify-between">
                <h2 className="font-bold text-tmain">รายการรออนุมัติ</h2>
                <span className="bg-primary text-dark-DEFAULT text-xs font-bold px-2.5 py-1 rounded-full">
                  {pendingBookings.length}
                </span>
              </div>

              {pendingBookings.length === 0 ? (
                <div className="p-8 text-center text-tmuted">
                  <CheckCircle size={32} className="mx-auto mb-2 text-success" />
                  <p>ไม่มีรายการรออนุมัติ</p>
                </div>
              ) : (
                <div className="divide-y divide-primary-dark/10">
                  {pendingBookings.map((booking) => (
                    <div key={booking.id} className="p-4 hover:bg-primary-light/50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-tmain text-sm">{booking.post?.title}</p>
                          <p className="text-xs text-tmuted">
                            ลูกค้า: {booking.customer?.full_name} → พาร์ทเนอร์: {booking.partner?.profile?.full_name}
                          </p>
                        </div>
                        {statusBadge(booking.status)}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-tmuted mb-3">
                        <span>📅 {new Date(booking.booking_date).toLocaleDateString('th-TH')}</span>
                        <span>👥 {booking.guests} คน</span>
                        {booking.total_price && <span className="text-secondary font-medium">฿{booking.total_price.toLocaleString()}</span>}
                      </div>

                      {booking.note && (
                        <p className="text-xs text-tmuted bg-primary-light rounded-lg p-2 mb-3">📝 {booking.note}</p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(booking.id)}
                          className="flex items-center gap-1 bg-success/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-success/90 transition"
                        >
                          <CheckCircle size={14} /> อนุมัติ
                        </button>
                        <button
                          onClick={() => handleOfferAlternative(booking)}
                          className="flex items-center gap-1 bg-purple/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple/90 transition"
                        >
                          <AlertCircle size={14} /> เสนอทางเลือก
                        </button>
                        <button
                          onClick={() => handleReject(booking.id)}
                          className="flex items-center gap-1 bg-danger/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-danger/90 transition"
                        >
                          <XCircle size={14} /> ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-primary-dark/20 shadow-sm">
              <div className="p-5 border-b border-primary-dark/15">
                <h2 className="font-bold text-tmain">Recent Activity</h2>
              </div>
              <div className="divide-y divide-primary-dark/10 max-h-[500px] overflow-y-auto">
                {recentActivity.map((booking) => (
                  <div key={booking.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-tmain truncate flex-1">{booking.partner?.profile?.full_name}</p>
                      {statusBadge(booking.status)}
                    </div>
                    <p className="text-xs text-tmuted">
                      {new Date(booking.updated_at).toLocaleDateString('th-TH')} {new Date(booking.updated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {booking.total_price && (
                      <p className="text-xs font-medium text-secondary mt-1">฿{booking.total_price.toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
