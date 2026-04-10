'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { Calendar, Users, MapPin, CreditCard, MessageCircle, ArrowLeft, Clock, Star, Globe, Navigation } from 'lucide-react';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'อนุมัติแล้ว รอชำระเงิน', color: 'bg-blue-100 text-blue-700' },
  alternative_offered: { label: 'มีตัวเลือกใหม่', color: 'bg-purple-100 text-purple-700' },
  paid: { label: 'ชำระแล้ว', color: 'bg-emerald-100 text-emerald-700' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;
    const fetchBooking = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`*, post:posts!bookings_post_id_fkey(*)`)
        .eq('id', id)
        .single();

      if (data) {
        const { data: customer } = await supabase.from('profiles').select('*').eq('id', data.customer_id).single();
        const { data: partner } = await supabase.from('profiles').select('*').eq('id', data.partner_id).single();
        const { data: partnerProfile } = await supabase.from('partner_profiles').select('*').eq('user_id', data.partner_id).maybeSingle();
        setBooking({ ...data, customer, partner, partnerProfile });
      }
      setLoading(false);
    };
    fetchBooking();

    const channel = supabase
      .channel(`booking-detail-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}` }, () => { fetchBooking(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-6 animate-blur-in lg:py-8">
          <div className="bg-white rounded-2xl p-6 animate-pulse space-y-4">
            <div className="w-2/3 h-6 bg-primary/20 rounded" />
            <div className="w-1/2 h-4 bg-primary/20 rounded" />
            <div className="w-full h-40 bg-primary/20 rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!booking) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-tmain font-medium">ไม่พบรายการจอง</p>
          <Link href="/booking" className="text-secondary font-medium mt-2 inline-block">กลับรายการจอง</Link>
        </div>
      </AppLayout>
    );
  }

  const status = statusMap[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700' };
  const post = booking.post;
  const image = post?.media_urls?.[0];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <Link href="/booking" className="flex items-center gap-1 text-tmuted mb-4 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition w-fit">
          <ArrowLeft size={18} /> กลับรายการจอง
        </Link>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
            {image && (
              <div className="relative w-full h-48 md:h-64 bg-primary/10">
                <img src={image} alt={post?.title || ''} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 text-tmain text-xs font-medium px-2.5 py-1 rounded-full">
                    {post?.category === 'guide' ? '🗺️ ไกด์' : post?.category === 'driver' ? '🚗 คนขับรถ' : '🌐 ล่าม'}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                </div>
              </div>
            )}

            {!image && (
              <div className="p-4 flex items-center justify-between">
                <span className="text-xs bg-primary/20 px-2.5 py-1 rounded-full text-tmain">
                  {post?.category === 'guide' ? '🗺️ ไกด์' : post?.category === 'driver' ? '🚗 คนขับรถ' : '🌐 ล่าม'}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
              </div>
            )}

            <div className="p-6">
              <h1 className="text-xl font-bold text-tmain mb-2">{post?.title}</h1>
              <p className="text-sm text-tmuted leading-relaxed mb-4">{post?.content}</p>

              {post?.media_urls?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                  {post.media_urls.slice(1).map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-sm text-tmuted">
                {post?.location && (
                  <span className="flex items-center gap-1 bg-primary-light px-3 py-1 rounded-full">
                    <MapPin size={14} /> {post.location}
                  </span>
                )}
                {post?.price_min && (
                  <span className="flex items-center gap-1 bg-secondary/20 px-3 py-1 rounded-full text-tmain font-medium">
                    ฿{post.price_min.toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-success/10 px-3 py-1 rounded-full text-tmain text-xs">
                  <Globe size={14} /> ตลอดทั้งปี
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-primary-dark/20 p-6">
            <h2 className="font-bold text-tmain mb-4">รายละเอียดการจอง</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary-light rounded-xl p-4">
                <p className="text-xs text-tmuted mb-1">ลูกค้า</p>
                <p className="font-medium text-tmain">{booking.customer?.full_name}</p>
              </div>
              <div className="bg-primary-light rounded-xl p-4">
                <p className="text-xs text-tmuted mb-1">พาร์ทเนอร์</p>
                <Link href={`/partner/${booking.partner_id}`} className="font-medium text-tmain hover:underline">
                  {booking.partnerProfile?.business_name || booking.partner?.full_name}
                </Link>
                {booking.partnerProfile?.rating > 0 && (
                  <p className="text-xs text-tmuted flex items-center gap-1 mt-0.5">
                    <Star size={10} className="text-amber-500 fill-amber-500" />
                    {booking.partnerProfile.rating.toFixed(1)} ({booking.partnerProfile.total_reviews} รีวิว)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <div className="text-center bg-primary-light/50 rounded-xl p-3">
                <Calendar size={18} className="text-tmuted mx-auto mb-1" />
                <p className="text-xs text-tmuted">วันที่จอง</p>
                <p className="text-sm font-medium text-tmain">{new Date(booking.booking_date).toLocaleDateString('th-TH')}</p>
              </div>
              <div className="text-center bg-primary-light/50 rounded-xl p-3">
                <Users size={18} className="text-tmuted mx-auto mb-1" />
                <p className="text-xs text-tmuted">จำนวน</p>
                <p className="text-sm font-medium text-tmain">{booking.guests} คน</p>
              </div>
              <div className="text-center bg-secondary/10 rounded-xl p-3">
                <CreditCard size={18} className="text-secondary mx-auto mb-1" />
                <p className="text-xs text-tmuted">ยอดรวม</p>
                <p className="text-sm font-bold text-secondary">฿{booking.total_price?.toLocaleString()}</p>
              </div>
            </div>

            {booking.note && (
              <div className="bg-primary-light rounded-xl p-4 mt-4">
                <p className="text-xs text-tmuted mb-1">หมายเหตุจากลูกค้า</p>
                <p className="text-sm text-tmain">{booking.note}</p>
              </div>
            )}

            {booking.admin_note && (
              <div className="bg-info/10 rounded-xl p-4 mt-4">
                <p className="text-xs text-tmuted mb-1">หมายเหตุจาก Admin</p>
                <p className="text-sm text-tmain">{booking.admin_note}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-tmuted mt-4 pt-3 border-t border-primary-dark/10">
              <Clock size={12} />
              <span>สร้างเมื่อ {new Date(booking.created_at).toLocaleString('th-TH')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            {['confirmed', 'paid', 'in_progress'].includes(booking.status) && (
              <Link
                href={`/chat/${booking.id}`}
                className="flex-1 bg-info/10 text-tmain font-medium py-3 rounded-xl text-sm text-center flex items-center justify-center gap-1.5 hover:bg-info/20 transition"
              >
                <MessageCircle size={16} /> แชท
              </Link>
            )}
            {booking.status === 'confirmed' && user?.role === 'customer' && (
              <Link
                href={`/booking/${booking.id}/pay`}
                className="flex-1 bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl text-sm text-center flex items-center justify-center gap-1.5 transition"
              >
                <CreditCard size={16} /> ชำระเงิน
              </Link>
            )}
            {booking.status === 'in_progress' && (
              <Link
                href={`/booking/${booking.id}/tracking`}
                className="flex-1 bg-success/20 text-tmain font-medium py-3 rounded-xl text-sm text-center flex items-center justify-center gap-1.5 hover:bg-success/30 transition"
              >
                <Navigation size={16} /> GPS Tracking
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
