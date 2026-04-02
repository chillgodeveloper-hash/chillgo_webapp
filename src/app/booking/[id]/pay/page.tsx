'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { CreditCard, Shield, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Booking } from '@/types';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`*, post:posts(*), partner:partner_profiles(*, profile:profiles(*))`)
        .eq('id', id)
        .single();
      setBooking(data);
      if (data?.status === 'paid') setPaid(true);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, amount: booking.total_price }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด');
      }

      await supabase
        .from('bookings')
        .update({ status: 'paid', stripe_payment_intent_id: data.paymentIntentId })
        .eq('id', booking.id);

      await supabase.from('notifications').insert([
        {
          user_id: user?.id,
          title: 'ชำระเงินสำเร็จ',
          message: `การจอง "${booking.post?.title}" ชำระเงินเรียบร้อยแล้ว`,
          type: 'payment',
          link: '/booking',
        },
        {
          user_id: booking.partner_id,
          title: 'ได้รับการชำระเงิน',
          message: `ลูกค้าชำระเงินสำหรับ "${booking.post?.title}" แล้ว`,
          type: 'payment',
          link: `/chat/${booking.id}`,
        },
      ]);

      setPaid(true);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
    setPaying(false);
  };

  if (paid) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-tmain mb-2">ชำระเงินสำเร็จ!</h2>
          <p className="text-tmuted mb-6">คุณสามารถแชทกับพาร์ทเนอร์ได้แล้ว</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/chat/${booking?.id}`)}
              className="bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-3 rounded-xl transition"
            >
              เริ่มแชท
            </button>
            <button
              onClick={() => router.push('/booking')}
              className="bg-white border border-primary-dark/30 text-tmain font-semibold px-6 py-3 rounded-xl transition hover:bg-primary/20"
            >
              ดูการจอง
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-tmuted mb-4 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition">
          <ArrowLeft size={18} /> กลับ
        </button>

        {loading ? (
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-primary/20 rounded w-2/3 mb-4" />
            <div className="h-4 bg-primary/20 rounded w-1/2" />
          </div>
        ) : booking ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-primary-dark/20">
              <h2 className="font-bold text-lg text-tmain mb-4">สรุปรายการ</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-tmuted">บริการ</span>
                  <span className="font-medium text-tmain">{booking.post?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tmuted">พาร์ทเนอร์</span>
                  <span className="font-medium text-tmain">{booking.partner?.profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tmuted">วันที่</span>
                  <span className="font-medium text-tmain">
                    {new Date(booking.booking_date).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tmuted">จำนวนคน</span>
                  <span className="font-medium text-tmain">{booking.guests} คน</span>
                </div>
                <div className="border-t border-primary-dark/10 pt-3 flex justify-between">
                  <span className="font-bold text-tmain">ยอดรวม</span>
                  <span className="font-bold text-secondary text-lg">
                    ฿{booking.total_price?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-primary-dark/20">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-tmuted" />
                <h3 className="font-bold text-tmain">ชำระเงิน</h3>
              </div>
              <p className="text-sm text-tmuted mb-4">
                ชำระผ่าน Stripe (รองรับ Visa, Mastercard, PromptPay)
              </p>

              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-danger" />
                  <p className="text-sm text-tmain">{error}</p>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-primary hover:bg-primary-dark text-tmain font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
              >
                {paying ? (
                  <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" />
                ) : (
                  <><CreditCard size={18} /> ชำระเงิน ฿{booking.total_price?.toLocaleString()}</>
                )}
              </button>
              <div className="flex items-center gap-1.5 justify-center mt-3 text-xs text-tmuted">
                <Shield size={12} /> การชำระเงินปลอดภัยด้วย Stripe
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
