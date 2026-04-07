'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { X, Calendar, Users, FileText, Send } from 'lucide-react';
import { Post } from '@/types';

interface BookingModalProps {
  post: Post;
  onClose: () => void;
}

export default function BookingModal({ post, onClose }: BookingModalProps) {
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('bookings').insert({
      customer_id: user.id,
      partner_id: post.partner_profile?.user_id,
      post_id: post.id,
      booking_date: date,
      booking_end_date: endDate || null,
      guests,
      note: note || null,
      status: 'pending',
      total_price: post.price_min,
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push('/booking');
      }, 1500);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white rounded-t-3xl lg:rounded-t-3xl border-b border-primary-dark/15 p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-tmain">จองบริการ</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary-dark/30 transition">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-tmain mb-2">ส่งคำขอจองสำเร็จ!</h3>
            <p className="text-tmuted text-sm">กรุณารอ Admin ตรวจสอบและอนุมัติ</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-primary-light rounded-2xl p-4">
              <p className="font-semibold text-tmain">{post.title}</p>
              <p className="text-sm text-tmuted">{post.partner_profile?.business_name}</p>
              {post.price_min && (
                <p className="text-secondary font-bold mt-1">฿{post.price_min.toLocaleString()}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-tmain mb-1 flex items-center gap-1.5">
                <Calendar size={14} /> วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tmain mb-1 flex items-center gap-1.5">
                <Calendar size={14} /> วันที่สิ้นสุด (ไม่บังคับ)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tmain mb-1 flex items-center gap-1.5">
                <Users size={14} /> จำนวนผู้เข้าร่วม
              </label>
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                min={1}
                max={50}
                className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-tmain mb-1 flex items-center gap-1.5">
                <FileText size={14} /> หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม เช่น ความต้องการพิเศษ"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} /> ยืนยันการจอง
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
