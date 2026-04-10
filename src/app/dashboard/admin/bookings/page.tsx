'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { CheckCircle, XCircle, Edit, MessageCircle, X, Save, Navigation } from 'lucide-react';
import { Booking } from '@/types';
import Link from 'next/link';
import FlatpickrInput from '@/components/ui/FlatpickrInput';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editBooking, setEditBooking] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({ booking_date: '', guests: 1, total_price: 0, partner_id: '', admin_note: '' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase.from('bookings').select(`*, post:posts!bookings_post_id_fkey(*)`).order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    const userIds = Array.from(new Set((data || []).flatMap((b: any) => [b.customer_id, b.partner_id])));
    const profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);
      profilesData?.forEach(p => { profileMap[p.id] = p; });
    }
    setBookings((data || []).map((b: any) => ({ ...b, customer: profileMap[b.customer_id] || null, partner: profileMap[b.partner_id] || null })));
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const openEdit = async (booking: any) => {
    setEditForm({ booking_date: booking.booking_date || '', guests: booking.guests || 1, total_price: booking.total_price || 0, partner_id: booking.partner_id || '', admin_note: booking.admin_note || '' });
    setEditBooking(booking);
    if (partners.length === 0) {
      const { data } = await supabase.from('partner_profiles').select('user_id, business_name, category').order('business_name');
      setPartners(data || []);
    }
  };

  const handleSaveEdit = async () => {
    if (!editBooking) return;
    setSaving(true);
    await supabase.from('bookings').update({ booking_date: editForm.booking_date, guests: editForm.guests, total_price: editForm.total_price, partner_id: editForm.partner_id, admin_note: editForm.admin_note || null }).eq('id', editBooking.id);
    await supabase.from('notifications').insert([
      { user_id: editBooking.customer_id, title: 'รายการจองถูกแก้ไข', message: `Admin แก้ไขรายละเอียดการจอง "${editBooking.post?.title}"`, type: 'booking', link: `/booking/${editBooking.id}` },
      { user_id: editForm.partner_id, title: 'รายการจองถูกแก้ไข', message: `Admin แก้ไขรายละเอียดการจอง "${editBooking.post?.title}"`, type: 'booking', link: '/booking' },
    ]);
    setSaving(false);
    setEditBooking(null);
    fetchBookings();
  };

  const handleApprove = async (id: string, booking: any) => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
    await supabase.from('notifications').insert([
      { user_id: booking.customer_id, title: 'การจองได้รับการอนุมัติ', message: `การจอง "${booking.post?.title}" อนุมัติแล้ว กรุณาชำระเงิน`, type: 'booking', link: `/booking/${id}` },
      { user_id: booking.partner_id, title: 'การจองได้รับการอนุมัติ', message: `การจอง "${booking.post?.title}" อนุมัติแล้ว`, type: 'booking', link: '/booking' },
    ]);
    fetchBookings();
  };

  const handleReject = async (id: string, booking: any) => {
    const reason = prompt('เหตุผลในการปฏิเสธ:');
    if (reason === null) return;
    await supabase.from('bookings').update({ status: 'cancelled', admin_note: reason }).eq('id', id);
    await supabase.from('notifications').insert([
      { user_id: booking.customer_id, title: 'การจองถูกปฏิเสธ', message: `การจอง "${booking.post?.title}" ถูกปฏิเสธ: ${reason}`, type: 'booking', link: `/booking/${id}` },
      { user_id: booking.partner_id, title: 'การจองถูกปฏิเสธ', message: `การจอง "${booking.post?.title}" ถูกปฏิเสธ: ${reason}`, type: 'booking', link: '/booking' },
    ]);
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
    };
    const s = map[status] || map.pending;
    return <span className={`${s.cls} px-2.5 py-0.5 rounded-full text-xs font-medium`}>{s.label}</span>;
  };

  const filterList = [
    { value: 'all', label: 'ทั้งหมด' }, { value: 'pending', label: 'รออนุมัติ' }, { value: 'confirmed', label: 'ยืนยัน' },
    { value: 'paid', label: 'ชำระแล้ว' }, { value: 'completed', label: 'เสร็จ' }, { value: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 lg:px-0 py-6 animate-blur-in lg:py-8">
        <h1 className="text-2xl font-bold text-tmain mb-6">รายการจองทั้งหมด</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {filterList.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${filter === f.value ? 'bg-dark-DEFAULT text-primary' : 'bg-primary-light text-tmain border border-primary-dark/20'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-primary/20 rounded-lg animate-pulse" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-tmuted">ไม่พบรายการ</div>
          ) : (
            <div className="divide-y divide-primary-dark/10">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-primary-light/50 transition">
                  <Link href={`/booking/${booking.id}`} className="block">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-tmain">{booking.post?.title}</p>
                        <p className="text-xs text-tmuted mt-0.5">{booking.customer?.full_name} → {(booking.partner as any)?.full_name}</p>
                      </div>
                      {statusBadge(booking.status)}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-tmuted">
                      <span>📅 {new Date(booking.booking_date).toLocaleDateString('th-TH')}</span>
                      <span>👥 {booking.guests} คน</span>
                      {booking.total_price && <span className="text-secondary font-medium">฿{booking.total_price.toLocaleString()}</span>}
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-primary-dark/10">
                    {booking.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(booking.id, booking)} className="flex items-center gap-1 bg-success/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-success/30 transition"><CheckCircle size={14} /> อนุมัติ</button>
                        <button onClick={() => handleReject(booking.id, booking)} className="flex items-center gap-1 bg-danger/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-danger/30 transition"><XCircle size={14} /> ปฏิเสธ</button>
                      </>
                    )}
                    {booking.status === 'pending' && (
                      <button onClick={() => openEdit(booking)} className="flex items-center gap-1 bg-secondary/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary/30 transition"><Edit size={14} /> แก้ไข</button>
                    )}
                    <Link href={`/chat/${booking.id}`} className="flex items-center gap-1 bg-info/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-info/30 transition"><MessageCircle size={14} /> แชท</Link>
                    {booking.status === 'in_progress' && (
                      <Link href={`/booking/${booking.id}/tracking`} className="flex items-center gap-1 bg-success/20 text-tmain px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-success/30 transition"><Navigation size={14} /> GPS</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditBooking(null)} />
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-primary-dark/15 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg text-tmain">แก้ไขรายการจอง</h2>
              <button onClick={() => setEditBooking(null)} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-tmuted">{editBooking.post?.title} — ลูกค้า: {editBooking.customer?.full_name}</p>
              <div>
                <label className="text-sm font-medium text-tmain mb-1 block">พาร์ทเนอร์</label>
                <select value={editForm.partner_id} onChange={(e) => setEditForm({ ...editForm, partner_id: e.target.value })} className="w-full h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary">
                  <option value="">เลือกพาร์ทเนอร์</option>
                  {partners.map((p) => <option key={p.user_id} value={p.user_id}>{p.business_name} ({p.category === 'guide' ? 'ไกด์' : p.category === 'driver' ? 'คนขับรถ' : 'ล่าม'})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-tmain mb-1 block">วันที่จอง</label>
                  <FlatpickrInput value={editForm.booking_date} onChange={(val) => setEditForm({ ...editForm, booking_date: val })} mode="date" placeholder="เลือกวันที่" className="w-full h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-tmain mb-1 block">จำนวนคน</label>
                  <input type="number" value={editForm.guests} onChange={(e) => setEditForm({ ...editForm, guests: parseInt(e.target.value) || 1 })} min={1} className="w-full h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-tmain mb-1 block">ราคารวม (฿)</label>
                <input type="number" value={editForm.total_price} onChange={(e) => setEditForm({ ...editForm, total_price: parseFloat(e.target.value) || 0 })} className="w-full h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-tmain mb-1 block">หมายเหตุ Admin</label>
                <textarea value={editForm.admin_note} onChange={(e) => setEditForm({ ...editForm, admin_note: e.target.value })} rows={3} className="w-full px-3 py-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary resize-none" />
              </div>
              <button onClick={handleSaveEdit} disabled={saving} className="w-full bg-primary hover:bg-primary-dark text-tmain font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><Save size={18} /> บันทึกการแก้ไข</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
