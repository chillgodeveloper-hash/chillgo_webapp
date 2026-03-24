'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { UserCheck, Ban, Search, Star, Map, Car } from 'lucide-react';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  const fetchPartners = async () => {
    setLoading(true);
    let query = supabase
      .from('partner_profiles')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false });

    const { data } = await query;
    setPartners(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPartners(); }, []);

  const toggleVerify = async (partnerId: string, current: boolean) => {
    await supabase
      .from('partner_profiles')
      .update({ is_verified: !current })
      .eq('id', partnerId);
    fetchPartners();
  };

  const filtered = partners.filter((p) =>
    !search ||
    p.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <h1 className="text-2xl font-bold text-tmain mb-6">จัดการพาร์ทเนอร์</h1>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาพาร์ทเนอร์..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 focus:border-primary outline-none"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="w-1/3 h-4 bg-gray-200 rounded" />
                    <div className="w-1/4 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((partner) => (
              <div key={partner.id} className="bg-white rounded-2xl p-4 border border-primary-dark/20 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-lg flex-shrink-0">
                    {partner.profile?.avatar_url ? (
                      <img src={partner.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      partner.profile?.full_name?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-tmain">{partner.business_name}</p>
                      {partner.is_verified && (
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">✓ ยืนยัน</span>
                      )}
                    </div>
                    <p className="text-sm text-tmuted">{partner.profile?.full_name} · {partner.profile?.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        partner.category === 'guide' ? 'bg-secondary/10 text-secondary' : 'bg-info/10 text-info'
                      }`}>
                        {partner.category === 'guide' ? '🗺️ ไกด์' : '🚗 รถเช่า'}
                      </span>
                      {partner.rating > 0 && (
                        <span className="text-xs text-tmuted flex items-center gap-0.5">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          {partner.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        ผลงาน: {partner.portfolio_images?.length || 0} รูป
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleVerify(partner.id, partner.is_verified)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        partner.is_verified
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-success text-white hover:bg-success/90'
                      }`}
                    >
                      {partner.is_verified ? (
                        <><Ban size={14} /> ยกเลิกยืนยัน</>
                      ) : (
                        <><UserCheck size={14} /> ยืนยัน</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
