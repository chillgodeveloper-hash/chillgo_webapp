'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { Users, Star, Map, Car, TrendingUp } from 'lucide-react';

export default function PartnersReportPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('partner_profiles')
        .select('*, profile:profiles(*)')
        .order('rating', { ascending: false });

      if (data) {
        const withBookings = await Promise.all(
          data.map(async (p) => {
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('partner_id', p.user_id)
              .in('status', ['paid', 'completed']);

            const { data: revenue } = await supabase
              .from('bookings')
              .select('total_price')
              .eq('partner_id', p.user_id)
              .in('status', ['paid', 'completed']);

            const totalRev = revenue?.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0;

            return { ...p, totalBookings: count || 0, totalRevenue: totalRev };
          })
        );
        setPartners(withBookings);
      }

      setLoading(false);
    };
    fetch();
  }, []);

  const guideCount = partners.filter((p) => p.category === 'guide').length;
  const carCount = partners.filter((p) => p.category === 'driver').length;
  const translatorCount = partners.filter((p) => p.category === 'translator').length;
  const totalRevenue = partners.reduce((sum, p) => sum + p.totalRevenue, 0);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-tmain mb-6">รายงานพาร์ทเนอร์</h1>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
            <Users size={20} className="text-secondary mb-2" />
            <p className="text-2xl font-bold text-tmain">{partners.length}</p>
            <p className="text-xs text-tmuted">พาร์ทเนอร์ทั้งหมด</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
            <Map size={20} className="text-secondary mb-2" />
            <p className="text-2xl font-bold text-tmain">{guideCount}</p>
            <p className="text-xs text-tmuted">ไกด์</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
            <Car size={20} className="text-info mb-2" />
            <p className="text-2xl font-bold text-tmain">{carCount}</p>
            <p className="text-xs text-tmuted">คนขับรถ</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
            <Users size={20} className="text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-tmain">{translatorCount}</p>
            <p className="text-xs text-tmuted">ล่าม</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-primary-dark/20">
            <TrendingUp size={20} className="text-success mb-2" />
            <p className="text-2xl font-bold text-tmain">฿{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-tmuted">รายได้รวม</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
          <div className="p-5 border-b border-primary-dark/15">
            <h2 className="font-bold text-tmain">อันดับพาร์ทเนอร์</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-3 border-primary-dark/30 border-t-secondary rounded-full animate-spin mx-auto" />
            </div>
          ) : partners.length === 0 ? (
            <div className="p-8 text-center text-tmuted">ยังไม่มีพาร์ทเนอร์</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary-light/50">
                    <th className="text-left py-3 px-4 text-tmuted font-medium">#</th>
                    <th className="text-left py-3 px-4 text-tmuted font-medium">พาร์ทเนอร์</th>
                    <th className="text-left py-3 px-4 text-tmuted font-medium">ประเภท</th>
                    <th className="text-center py-3 px-4 text-tmuted font-medium">คะแนน</th>
                    <th className="text-center py-3 px-4 text-tmuted font-medium">จำนวนจอง</th>
                    <th className="text-right py-3 px-4 text-tmuted font-medium">รายได้</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p, i) => (
                    <tr key={p.id} className="border-t border-primary-dark/10 hover:bg-primary-light/30 transition">
                      <td className="py-3 px-4 text-tmuted">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-tmain font-bold text-sm flex-shrink-0">
                            {p.profile?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-tmain">{p.business_name}</p>
                            <p className="text-xs text-tmuted">{p.profile?.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.category === 'guide' ? 'bg-secondary/20 text-tmain' : 'bg-info/20 text-tmain'
                        }`}>
                          {p.category === 'guide' ? '🗺️ ไกด์' : p.category === 'driver' ? '🚗 คนขับรถ' : '🌐 ล่าม'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Star size={14} className="text-amber-500 fill-amber-500" />
                          {p.rating > 0 ? p.rating.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-tmain">{p.totalBookings}</td>
                      <td className="py-3 px-4 text-right font-semibold text-secondary">฿{p.totalRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
