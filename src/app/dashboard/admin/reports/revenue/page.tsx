'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { DollarSign, TrendingUp, CalendarCheck, Users } from 'lucide-react';

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
}

export default function RevenueReportPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, bookings: 0, avgOrder: 0, partners: 0 });
  const [loading, setLoading] = useState(true);
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

        months.forEach((m, i) => {
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

      setLoading(false);
    };
    fetch();
  }, []);

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-tmain mb-6">รายงานรายได้</h1>

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
                        background: d.revenue > 0
                          ? 'linear-gradient(to top, #FF9800, #FFDE5B)'
                          : '#FFD03520',
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
      </div>
    </AppLayout>
  );
}
