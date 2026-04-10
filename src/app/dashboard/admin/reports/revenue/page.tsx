'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { DollarSign, TrendingUp, CalendarCheck, Users, Receipt, Eye, CreditCard, QrCode } from 'lucide-react';
import Link from 'next/link';

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
}

type Tab = 'overview' | 'receipts';

export default function RevenueReportPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, bookings: 0, avgOrder: 0, partners: 0 });
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_price, created_at, status')
        .in('status', ['paid', 'completed']);

      const { count: partnerCount } = await supabase
        .from('partner_profiles')
        .select('*', { count: 'exact', head: true });

      if (bookings) {
        const monthMap: Record<string, { revenue: number; bookings: number }> = {};
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        months.forEach((m) => {
          monthMap[m] = { revenue: 0, bookings: 0 };
        });

        let totalRev = 0;
        bookings.forEach((b) => {
          const d = new Date(b.created_at);
          const monthName = months[d.getMonth()];
          monthMap[monthName].revenue += b.total_price || 0;
          monthMap[monthName].bookings += 1;
          totalRev += b.total_price || 0;
        });

        const data = months.map((m) => ({
          month: m,
          revenue: monthMap[m].revenue,
          bookings: monthMap[m].bookings,
        }));

        setMonthlyData(data);
        setTotals({
          revenue: totalRev,
          bookings: bookings.length,
          avgOrder: bookings.length > 0 ? Math.round(totalRev / bookings.length) : 0,
          partners: partnerCount || 0,
        });
      }

      const { data: receiptData } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });
      setReceipts(receiptData || []);

      setLoading(false);
    };
    fetch();
  }, []);

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 animate-blur-in">
        <h1 className="text-2xl font-bold text-tmain mb-6">รายงาน</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('overview')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === 'overview' ? 'bg-secondary text-tmain shadow-sm' : 'bg-white border border-primary-dark/20 text-tmuted hover:bg-primary/20'
            }`}
          >
            <TrendingUp size={14} className="inline mr-1.5" />ภาพรวมรายได้
          </button>
          <button
            onClick={() => setTab('receipts')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === 'receipts' ? 'bg-secondary text-tmain shadow-sm' : 'bg-white border border-primary-dark/20 text-tmuted hover:bg-primary/20'
            }`}
          >
            <Receipt size={14} className="inline mr-1.5" />ใบเสร็จทั้งหมด
          </button>
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
                <DollarSign size={20} className="text-secondary mb-2" />
                <p className="text-2xl font-bold text-tmain">฿{totals.revenue.toLocaleString()}</p>
                <p className="text-xs text-tmuted">รายได้ทั้งหมด</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
                <CalendarCheck size={20} className="text-info mb-2" />
                <p className="text-2xl font-bold text-tmain">{totals.bookings}</p>
                <p className="text-xs text-tmuted">การจองที่ชำระแล้ว</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
                <TrendingUp size={20} className="text-success mb-2" />
                <p className="text-2xl font-bold text-tmain">฿{totals.avgOrder.toLocaleString()}</p>
                <p className="text-xs text-tmuted">ค่าเฉลี่ยต่อออเดอร์</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
                <Users size={20} className="text-secondary mb-2" />
                <p className="text-2xl font-bold text-tmain">{totals.partners}</p>
                <p className="text-xs text-tmuted">พาร์ทเนอร์ทั้งหมด</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-primary-dark/20 mb-8">
              <h2 className="font-bold text-tmain mb-6">รายได้รายเดือน</h2>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-primary-dark/30 border-t-secondary rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex items-end gap-2 h-64">
                  {monthlyData.map((d) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-tmuted font-medium">
                        {d.revenue > 0 ? `฿${(d.revenue / 1000).toFixed(0)}k` : ''}
                      </span>
                      <div className="w-full flex justify-center">
                        <div
                          className="w-full max-w-[40px] rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${Math.max((d.revenue / maxRevenue) * 200, d.revenue > 0 ? 8 : 2)}px`,
                            background: d.revenue > 0 ? 'linear-gradient(to top, #FF9800, #FFDE5B)' : '#FFD03520',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-tmuted">{d.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-primary-dark/20">
              <h2 className="font-bold text-tmain mb-4">สรุปรายเดือน</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-dark/15">
                      <th className="text-left py-3 text-tmuted font-medium">เดือน</th>
                      <th className="text-right py-3 text-tmuted font-medium">จำนวนจอง</th>
                      <th className="text-right py-3 text-tmuted font-medium">รายได้</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.filter((d) => d.revenue > 0 || d.bookings > 0).map((d) => (
                      <tr key={d.month} className="border-b border-primary-dark/10">
                        <td className="py-3 text-tmain font-medium">{d.month}</td>
                        <td className="py-3 text-right text-tmain">{d.bookings}</td>
                        <td className="py-3 text-right text-secondary font-semibold">฿{d.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {monthlyData.every((d) => d.revenue === 0) && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-tmuted">ยังไม่มีข้อมูลรายได้</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'receipts' && (
          <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
            <div className="p-6 border-b border-primary-dark/15">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-tmain">ใบเสร็จทั้งหมด</h2>
                <span className="text-sm text-tmuted">{receipts.length} รายการ</span>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-dark/30 border-t-secondary rounded-full animate-spin mx-auto" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt size={40} className="text-primary mx-auto mb-3" />
                <p className="text-tmuted">ยังไม่มีใบเสร็จ</p>
              </div>
            ) : (
              <div className="divide-y divide-primary-dark/10">
                {receipts.map((r) => (
                  <div key={r.id} className="p-4 hover:bg-primary-light/30 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          {r.payment_method === 'promptpay' ? <QrCode size={18} className="text-success" /> : <CreditCard size={18} className="text-success" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-tmain text-sm truncate">{r.service_title}</p>
                          <p className="text-xs text-tmuted">
                            {r.receipt_number} · {r.customer_name} → {r.partner_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-secondary">฿{Number(r.amount).toLocaleString()}</p>
                        <p className="text-[11px] text-tmuted">
                          {new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 ml-[52px]">
                      <span className="text-[11px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">ชำระแล้ว</span>
                      <span className="text-[11px] bg-primary-light text-tmuted px-2 py-0.5 rounded-full">
                        {r.payment_method === 'promptpay' ? 'PromptPay' : 'บัตรเครดิต/เดบิต'}
                      </span>
                      <Link
                        href={`/booking/${r.booking_id}/receipt`}
                        className="ml-auto text-[11px] text-tmuted hover:text-tmain flex items-center gap-1 hover:bg-primary/20 px-2 py-0.5 rounded-lg transition"
                      >
                        <Eye size={12} /> ดูใบเสร็จ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
