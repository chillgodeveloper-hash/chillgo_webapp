'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Loader2, LogOut, RefreshCw, ChevronDown, ShoppingBag } from 'lucide-react';
import PartnerProfileForm, { PartnerCategory } from '@/components/partner/PartnerProfileForm';

export default function PartnerSetupPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [localPartnerProfile, setLocalPartnerProfile] = useState<any>(null);
  const [allPartnerProfiles, setAllPartnerProfiles] = useState<any[]>([]);
  const [switchMenuOpen, setSwitchMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const { user, partnerProfile, setPartnerProfile, setUser } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const category: PartnerCategory = (localPartnerProfile?.category as PartnerCategory) || 'guide';

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      let currentUser = user;
      if (!currentUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) { setUser(profile); currentUser = profile; }
      }

      let pp = partnerProfile;
      if (currentUser) {
        const { data: allPPs } = await supabase
          .from('partner_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        setAllPartnerProfiles(allPPs || []);
        if (allPPs && allPPs.length > 0) {
          const activeId = localStorage.getItem('active_partner_id');
          const activePP = activeId ? allPPs.find((p: any) => p.id === activeId) : null;
          if (activePP) {
            pp = activePP;
          } else {
            const unfinished = allPPs.find((p: any) => !p.portfolio_images || p.portfolio_images.length === 0);
            pp = unfinished || allPPs[0];
            if (pp) localStorage.setItem('active_partner_id', pp.id);
          }
          setPartnerProfile(pp);
        }
      }

      setLocalPartnerProfile(pp);
      setPageLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth/login'); };

  const handleSwitchToCustomer = async () => {
    if (!user) return;
    setSwitching(true);
    if (localPartnerProfile && (!localPartnerProfile.portfolio_images || localPartnerProfile.portfolio_images.length === 0)) {
      await supabase.from('partner_profiles').delete().eq('id', localPartnerProfile.id);
    }
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', user.id);
    setUser({ ...user, role: 'customer' });
    setPartnerProfile(null);
    localStorage.removeItem('active_partner_id');
    window.location.href = '/feed';
  };

  const handleSwitchPartner = async (targetCategory: PartnerCategory) => {
    if (!user || targetCategory === category) return;
    setSwitching(true);

    if (localPartnerProfile && (!localPartnerProfile.portfolio_images || localPartnerProfile.portfolio_images.length === 0)) {
      await supabase.from('partner_profiles').delete().eq('id', localPartnerProfile.id);
    }

    const existing = allPartnerProfiles.find((p: any) => p.category === targetCategory && p.id !== localPartnerProfile?.id);
    if (existing) {
      localStorage.setItem('active_partner_id', existing.id);
      setPartnerProfile(existing);
      if (existing.portfolio_images && existing.portfolio_images.length > 0) {
        window.location.href = '/feed';
      } else {
        window.location.reload();
      }
    } else {
      const { data: newPP } = await supabase.from('partner_profiles').insert({
        user_id: user.id, category: targetCategory, business_name: user.full_name,
        description: '', portfolio_images: [], is_verified: false,
      }).select().single();
      if (newPP) {
        localStorage.setItem('active_partner_id', newPP.id);
        setPartnerProfile(newPP);
      }
      window.location.reload();
    }
  };

  if (pageLoading || !localPartnerProfile) {
    return <div className="min-h-screen bg-primary-light flex items-center justify-center"><Loader2 size={40} className="text-secondary animate-spin" /></div>;
  }

  const categoryLabel = category === 'driver' ? 'คนขับรถนำเที่ยว' : 'ไกด์นำเที่ยว';

  return (
    <div className="min-h-screen bg-primary-light flex justify-center p-4">
      <div className="max-w-lg w-full py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <button
              onClick={() => setSwitchMenuOpen((o) => !o)}
              disabled={switching}
              className="flex items-center gap-1.5 text-sm text-tmuted hover:bg-white/50 transition px-3 py-2 rounded-xl disabled:opacity-50"
            >
              <RefreshCw size={16} className={switching ? 'animate-spin' : ''} /> เปลี่ยนบทบาท <ChevronDown size={14} />
            </button>
            {switchMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSwitchMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-primary-dark/15 py-1 z-20">
                  <button
                    onClick={() => { setSwitchMenuOpen(false); handleSwitchToCustomer(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-tmain hover:bg-primary-light transition text-left"
                  >
                    <ShoppingBag size={16} /> เปลี่ยนเป็นลูกค้า
                  </button>
                  <div className="border-t border-primary-dark/10 my-1" />
                  <p className="px-4 py-1.5 text-xs text-tmuted font-medium">เปลี่ยนเป็น Partner</p>
                  {([
                    { key: 'guide' as const, icon: '🗺️', label: 'ไกด์นำเที่ยว' },
                    { key: 'driver' as const, icon: '🚗', label: 'คนขับรถ' },
                  ]).map((opt) => {
                    const isCurrent = opt.key === category;
                    const profile = allPartnerProfiles.find((p: any) => p.category === opt.key && p.id !== localPartnerProfile?.id);
                    const registered = !!(profile && profile.portfolio_images && profile.portfolio_images.length > 0);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => { setSwitchMenuOpen(false); handleSwitchPartner(opt.key); }}
                        disabled={isCurrent}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-tmain transition text-left ${isCurrent ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-light'}`}
                      >
                        <span className="flex items-center gap-2"><span>{opt.icon}</span><span>{opt.label}</span></span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isCurrent ? 'bg-primary/30 text-tmain' : registered ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                        }`}>
                          {isCurrent ? 'ปัจจุบัน' : registered ? 'ลงทะเบียนแล้ว' : 'ยังไม่ได้ลงทะเบียน'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-danger hover:bg-danger/5 transition px-3 py-2 rounded-xl"><LogOut size={16} /> ออกจากระบบ</button>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-tmain">ลงทะเบียน{categoryLabel}</h1>
          <p className="text-tmuted mt-1 text-sm">กรอกข้อมูลโปรไฟล์ของคุณให้ครบถ้วน</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 animate-fade-in">
          <PartnerProfileForm
            category={category}
            profile={localPartnerProfile}
            userId={user!.id}
            currentAvatarUrl={user?.avatar_url || ''}
            submitLabel="ลงทะเบียน"
            onSaved={(updated) => {
              setPartnerProfile({ ...localPartnerProfile, ...updated });
              router.push('/feed');
            }}
          />
        </div>
      </div>
    </div>
  );
}
