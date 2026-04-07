'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { Star, MapPin, Calendar, CheckCircle, Briefcase, Image as ImageIcon } from 'lucide-react';

export default function PartnerProfilePage() {
  const { id } = useParams();
  const [partner, setPartner] = useState<any>(null);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history' | 'reviews'>('portfolio');
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: pp } = await supabase
        .from('partner_profiles')
        .select('*, profile:profiles(*)')
        .eq('user_id', id)
        .single();
      setPartner(pp);

      const { data: wh } = await supabase
        .from('work_history')
        .select('*, post:posts(title, category, location)')
        .eq('partner_id', id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      setWorkHistory(wh || []);

      const { data: rv } = await supabase
        .from('reviews')
        .select('*')
        .eq('partner_id', id)
        .order('created_at', { ascending: false });

      const customerIds = [...new Set((rv || []).map((r: any) => r.customer_id))];
      if (customerIds.length > 0) {
        const { data: customers } = await supabase.from('profiles').select('id, full_name').in('id', customerIds);
        const custMap: Record<string, any> = {};
        customers?.forEach(c => { custMap[c.id] = c; });
        setReviews((rv || []).map((r: any) => ({ ...r, customer: custMap[r.customer_id] || null })));
      } else {
        setReviews(rv || []);
      }

      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/20" />
              <div className="space-y-2 flex-1">
                <div className="w-1/3 h-6 bg-primary/20 rounded" />
                <div className="w-1/4 h-4 bg-primary/20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!partner) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-tmain font-medium text-lg">ไม่พบพาร์ทเนอร์</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary-dark to-secondary p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                {partner.profile?.avatar_url ? (
                  <img src={partner.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-tmain">{partner.profile?.full_name?.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-tmain">{partner.business_name}</h1>
                  {partner.is_verified && (
                    <span className="bg-success/20 text-tmain text-xs px-2 py-0.5 rounded-full font-medium">✓ ยืนยัน</span>
                  )}
                </div>
                <p className="text-sm text-tmain/70">{partner.profile?.full_name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full text-tmain">
                    {partner.category === 'guide' ? '🗺️ ไกด์' : '🚗 รถเช่า'}
                  </span>
                  {partner.rating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-tmain">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      {partner.rating.toFixed(1)} ({partner.total_reviews} รีวิว)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {partner.description && (
            <div className="px-6 py-4 border-b border-primary-dark/10">
              <p className="text-sm text-tmuted">{partner.description}</p>
            </div>
          )}

          <div className="flex border-b border-primary-dark/10">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 py-3 text-sm font-medium text-center transition ${
                activeTab === 'portfolio' ? 'text-tmain border-b-2 border-secondary' : 'text-tmuted'
              }`}
            >
              <ImageIcon size={16} className="inline mr-1.5" /> ผลงาน ({partner.portfolio_images?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-medium text-center transition ${
                activeTab === 'history' ? 'text-tmain border-b-2 border-secondary' : 'text-tmuted'
              }`}
            >
              <Briefcase size={16} className="inline mr-1.5" /> ประวัติงาน ({workHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-3 text-sm font-medium text-center transition ${
                activeTab === 'reviews' ? 'text-tmain border-b-2 border-secondary' : 'text-tmuted'
              }`}
            >
              <Star size={16} className="inline mr-1.5" /> รีวิว ({reviews.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'portfolio' && (
              <div>
                {partner.portfolio_images?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {partner.portfolio_images.map((url: string, i: number) => (
                      <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-tmuted py-8">ยังไม่มีผลงาน</p>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {workHistory.length > 0 ? (
                  <div className="space-y-3">
                    {workHistory.map((wh) => (
                      <div key={wh.id} className="flex items-center gap-4 p-4 bg-primary-light rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={20} className="text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-tmain text-sm">{wh.post?.title}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-tmuted mt-1">
                            <span>{wh.post?.category === 'guide' ? '🗺️ ไกด์' : '🚗 รถเช่า'}</span>
                            {wh.post?.location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {wh.post.location}</span>}
                            <span className="flex items-center gap-0.5"><Calendar size={10} /> {new Date(wh.completed_at).toLocaleDateString('th-TH')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-tmuted py-8">ยังไม่มีประวัติงาน</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((rv) => (
                      <div key={rv.id} className="border-b border-primary-dark/10 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-tmain font-bold text-xs">
                              {rv.customer?.full_name?.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-tmain">{rv.customer?.full_name}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={14} className={s <= rv.rating ? 'text-amber-500 fill-amber-500' : 'text-primary-dark/20'} />
                            ))}
                          </div>
                        </div>
                        {rv.comment && <p className="text-sm text-tmuted">{rv.comment}</p>}
                        <p className="text-xs text-tmuted mt-1">{new Date(rv.created_at).toLocaleDateString('th-TH')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-tmuted py-8">ยังไม่มีรีวิว</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
