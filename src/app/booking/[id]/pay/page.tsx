'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { CreditCard, Shield, ArrowLeft, CheckCircle, AlertTriangle, Smartphone, QrCode } from 'lucide-react';
import { Booking } from '@/types';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PaymentTab = 'card' | 'promptpay';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<PaymentTab>('card');
  const [clientSecret, setClientSecret] = useState('');
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const s = await stripePromise;
      setStripe(s);

      const { data } = await supabase
        .from('bookings')
        .select(`*, post:posts!bookings_post_id_fkey(*)`)
        .eq('id', id)
        .single();

      if (data) {
        const { data: partnerData } = await supabase.from('profiles').select('*').eq('id', data.partner_id).single();
        setBooking({ ...data, partner: partnerData });

        if (data.status === 'paid') {
          setPaid(true);
          const { data: receiptData } = await supabase
            .from('receipts')
            .select('*')
            .eq('booking_id', data.id)
            .maybeSingle();
          if (receiptData) setReceipt(receiptData);
        }
      }
      setLoading(false);
    };
    init();
  }, [id]);

  const createPI = useCallback(async () => {
    if (!booking) return;
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, amount: booking.total_price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถสร้างรายการชำระเงินได้');
    }
  }, [booking]);

  useEffect(() => {
    if (booking && booking.status === 'confirmed' && !clientSecret) {
      createPI();
    }
  }, [booking, createPI, clientSecret]);

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    const el = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'flat',
        variables: {
          fontFamily: 'Prompt, sans-serif',
          colorPrimary: '#FF9800',
          colorBackground: '#FFFFFF',
          colorText: '#333333',
          colorDanger: '#F44336',
          borderRadius: '12px',
          spacingUnit: '4px',
        },
        rules: {
          '.Input': {
            border: '1px solid #FFD035',
            boxShadow: 'none',
            padding: '12px',
          },
          '.Input:focus': {
            border: '2px solid #FF9800',
            boxShadow: '0 0 0 2px rgba(255,152,0,0.2)',
          },
          '.Tab': {
            border: '1px solid #FFD035',
          },
          '.Tab--selected': {
            backgroundColor: '#FFDE5B',
            borderColor: '#FF9800',
          },
        },
      },
    });

    setElements(el);
  }, [stripe, clientSecret]);

  useEffect(() => {
    if (!elements) return;

    const container = document.getElementById('card-element');
    if (container && activeTab === 'card') {
      container.innerHTML = '';
      const cardEl = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            fontFamily: 'Prompt, sans-serif',
            color: '#333333',
            '::placeholder': { color: '#757575' },
          },
        },
        hidePostalCode: true,
      });
      cardEl.mount(container);
      cardEl.on('ready', () => setCardReady(true));
      cardEl.on('change', (e) => {
        if (e.error) setError(e.error.message);
        else setError('');
      });
    }

    if (activeTab === 'promptpay') {
      setCardReady(true);
    }
  }, [elements, activeTab]);

  const handlePay = async () => {
    if (!stripe || !elements || !booking || !clientSecret) return;
    setPaying(true);
    setError('');

    try {
      let result;

      if (activeTab === 'card') {
        const cardElement = elements.getElement('card');
        if (!cardElement) throw new Error('Card element not found');

        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user?.email || '',
              name: user?.full_name || '',
            },
          },
        });
      } else if (activeTab === 'promptpay') {
        result = await stripe.confirmPromptPayPayment(clientSecret, {
          payment_method: {
            billing_details: {
              email: user?.email || '',
              name: user?.full_name || '',
            },
          },
          return_url: `${window.location.origin}/booking/${booking.id}/pay?status=complete`,
        });
      }

      if (result?.error) {
        if (result.error.code === 'payment_intent_unexpected_state') {
          setClientSecret('');
          setError('เซสชั่นหมดอายุ กรุณากดชำระเงินอีกครั้ง');
          setTimeout(() => createPI(), 500);
        } else {
          setError(result.error.message || 'เกิดข้อผิดพลาด');
        }
        setPaying(false);
        return;
      }

      if (result?.paymentIntent?.status === 'succeeded') {
        await supabase
          .from('bookings')
          .update({ status: 'paid', stripe_payment_intent_id: result.paymentIntent.id })
          .eq('id', booking.id);

        setPaid(true);

        try {
          const receiptRes = await fetch('/api/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: booking.id,
              paymentIntentId: result.paymentIntent.id,
              paymentMethod: activeTab,
            }),
          });
          const receiptJson = await receiptRes.json();
          if (receiptJson.receipt) setReceipt(receiptJson.receipt);
        } catch {}
      } else if (result?.paymentIntent?.status === 'requires_action') {
        setPaying(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
    setPaying(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'complete') {
      setPaid(true);
      const createReceipt = async () => {
        try {
          const piId = params.get('payment_intent') || '';
          const res = await fetch('/api/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: id,
              paymentIntentId: piId,
              paymentMethod: 'promptpay',
            }),
          });
          const json = await res.json();
          if (json.receipt) setReceipt(json.receipt);
        } catch {}
      };
      createReceipt();
    }
  }, []);

  if (paid) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
            <div className="bg-gradient-to-r from-primary via-primary-dark to-secondary p-6 text-center">
              <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-tmain" />
              </div>
              <h2 className="text-xl font-bold text-tmain">ชำระเงินสำเร็จ!</h2>
              <p className="text-sm text-tmain/70 mt-1">ขอบคุณสำหรับการชำระเงิน</p>
            </div>

            {receipt ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-tmuted">เลขที่ใบเสร็จ</span>
                  <span className="text-sm font-mono font-bold text-tmain">{receipt.receipt_number}</span>
                </div>

                <div className="border-t border-dashed border-primary-dark/20 my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-tmuted">บริการ</span>
                    <span className="font-medium text-tmain text-right max-w-[60%]">{receipt.service_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tmuted">ลูกค้า</span>
                    <span className="font-medium text-tmain">{receipt.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tmuted">พาร์ทเนอร์</span>
                    <span className="font-medium text-tmain">{receipt.partner_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tmuted">วันที่ใช้บริการ</span>
                    <span className="font-medium text-tmain">
                      {new Date(receipt.booking_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {receipt.booking_end_date && ` — ${new Date(receipt.booking_end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tmuted">จำนวนคน</span>
                    <span className="font-medium text-tmain">{receipt.guests} คน</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tmuted">ช่องทางชำระ</span>
                    <span className="font-medium text-tmain">
                      {receipt.payment_method === 'promptpay' ? 'PromptPay' : receipt.payment_method === 'card' ? 'บัตรเครดิต/เดบิต' : receipt.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tmuted">วันที่ชำระ</span>
                    <span className="font-medium text-tmain">
                      {new Date(receipt.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-primary-dark/20 my-4" />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-tmain text-lg">ยอดรวม</span>
                  <span className="font-bold text-secondary text-2xl">฿{Number(receipt.amount).toLocaleString()}</span>
                </div>

                <div className="bg-success/10 rounded-xl p-3 mt-4 flex items-center gap-2">
                  <CheckCircle size={16} className="text-success" />
                  <span className="text-sm text-tmain font-medium">ชำระเงินเรียบร้อยแล้ว</span>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => router.push(`/booking/${booking?.id}/receipt`)}
                    className="w-full bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    ดูใบเสร็จฉบับเต็ม / ดาวน์โหลด PDF
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/chat/${booking?.id}`)}
                      className="flex-1 bg-info/10 text-tmain font-medium py-2.5 rounded-xl transition hover:bg-info/20 text-sm"
                    >
                      เริ่มแชท
                    </button>
                    <button
                      onClick={() => router.push('/booking')}
                      className="flex-1 bg-white border border-primary-dark/30 text-tmain font-medium py-2.5 rounded-xl transition hover:bg-primary/20 text-sm"
                    >
                      ดูการจอง
                    </button>
                  </div>
                </div>

                <p className="text-center text-[11px] text-tmuted mt-4">
                  ใบเสร็จจะถูกส่งไปทางอีเมลของคุณและพาร์ทเนอร์อัตโนมัติ
                </p>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-tmuted text-sm mb-4">กำลังสร้างใบเสร็จ...</p>
                <div className="w-8 h-8 border-2 border-primary-dark/30 border-t-secondary rounded-full animate-spin mx-auto" />
                <p className="text-xs text-tmuted mt-3">Webhook กำลังประมวลผล อาจใช้เวลาสักครู่</p>
                <button
                  onClick={async () => {
                    const { data } = await supabase.from('receipts').select('*').eq('booking_id', booking?.id).maybeSingle();
                    if (data) setReceipt(data);
                  }}
                  className="mt-3 text-sm text-tmuted hover:text-tmain hover:bg-primary/20 px-4 py-1.5 rounded-lg transition"
                >
                  ลองโหลดใหม่
                </button>
                <div className="flex gap-2 mt-6">
                  <button onClick={() => router.push(`/chat/${booking?.id}`)} className="flex-1 bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl transition">
                    เริ่มแชท
                  </button>
                  <button onClick={() => router.push('/booking')} className="flex-1 bg-white border border-primary-dark/30 text-tmain font-semibold py-3 rounded-xl transition hover:bg-primary/20">
                    ดูการจอง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-8 animate-blur-in">
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
                  <span className="font-medium text-tmain">{(booking.partner as any)?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tmuted">วันที่</span>
                  <span className="font-medium text-tmain">
                    {new Date(booking.booking_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tmuted">จำนวนคน</span>
                  <span className="font-medium text-tmain">{booking.guests} คน</span>
                </div>
                <div className="border-t border-primary-dark/10 pt-3 flex justify-between">
                  <span className="font-bold text-tmain">ยอดรวม</span>
                  <span className="font-bold text-secondary text-lg">฿{booking.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-primary-dark/20">
              <h3 className="font-bold text-tmain mb-4">เลือกช่องทางชำระเงิน</h3>

              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setActiveTab('card')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition border-2 ${
                    activeTab === 'card'
                      ? 'border-secondary bg-secondary/10 text-tmain'
                      : 'border-primary-dark/20 bg-white text-tmuted hover:border-primary'
                  }`}
                >
                  <CreditCard size={18} /> บัตรเครดิต/เดบิต
                </button>
                <button
                  onClick={() => setActiveTab('promptpay')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition border-2 ${
                    activeTab === 'promptpay'
                      ? 'border-secondary bg-secondary/10 text-tmain'
                      : 'border-primary-dark/20 bg-white text-tmuted hover:border-primary'
                  }`}
                >
                  <QrCode size={18} /> PromptPay
                </button>
              </div>

              {activeTab === 'card' && (
                <div className="mb-4">
                  <div id="card-element" className="p-4 border border-primary-dark/30 rounded-xl bg-white min-h-[44px]" />
                  <p className="text-[11px] text-tmuted mt-2 flex items-center gap-1">
                    <Smartphone size={12} /> รองรับ Apple Pay / Google Pay ผ่านบัตรที่ผูกไว้
                  </p>
                </div>
              )}

              {activeTab === 'promptpay' && (
                <div className="mb-4 bg-primary-light/50 rounded-xl p-4 text-center">
                  <QrCode size={40} className="text-tmuted mx-auto mb-2" />
                  <p className="text-sm text-tmain font-medium">PromptPay QR Code</p>
                  <p className="text-xs text-tmuted mt-1">กดชำระเงิน แล้วสแกน QR Code ด้วยแอปธนาคาร</p>
                </div>
              )}

              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                  <p className="text-sm text-tmain">{error}</p>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying || !clientSecret || (activeTab === 'card' && !cardReady)}
                className="w-full bg-primary hover:bg-primary-dark text-tmain font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-40"
              >
                {paying ? (
                  <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" />
                ) : (
                  <>
                    {activeTab === 'card' ? <CreditCard size={18} /> : <QrCode size={18} />}
                    ชำระเงิน ฿{booking.total_price?.toLocaleString()}
                  </>
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
