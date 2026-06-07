'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import PartnerProfileForm, { PartnerCategory } from '@/components/partner/PartnerProfileForm';

export default function PartnerEditPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser, partnerProfile, setPartnerProfile } = useAuthStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [target, setTarget] = useState<any>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      if (user.role !== 'partner') {
        router.replace('/feed');
        return;
      }

      const activeId = typeof window !== 'undefined' ? localStorage.getItem('active_partner_id') : null;
      let found = partnerProfile;
      if (activeId) {
        const { data } = await supabase.from('partner_profiles').select('*').eq('id', activeId).maybeSingle();
        if (data) found = data;
      }
      if (!found) {
        const { data } = await supabase.from('partner_profiles').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (data) found = data;
      }
      if (found) {
        setPartnerProfile(found);
        setTarget(found);
      }
      setPageLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (pageLoading || !target) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 size={32} className="text-secondary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const cat: PartnerCategory = (target.category as PartnerCategory) || 'guide';
  const catLabel = cat === 'driver' ? 'คนขับรถ' : 'ไกด์นำเที่ยว';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 animate-blur-in">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-tmuted hover:bg-primary/20 px-3 py-2 rounded-xl transition">
            <ArrowLeft size={16} /> ย้อนกลับ
          </button>
          {savedFlash && (
            <span className="flex items-center gap-1.5 text-sm text-success font-semibold px-3 py-2"><Check size={16} /> บันทึกแล้ว</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-tmain">แก้ไขโปรไฟล์ {catLabel}</h1>
        <p className="text-sm text-tmuted mt-1 mb-4">แก้ไขข้อมูลแล้วกดบันทึก</p>

        <div className="bg-white rounded-2xl border border-primary-dark/20 p-5 lg:p-6">
          <PartnerProfileForm
            category={cat}
            profile={target}
            userId={user!.id}
            currentAvatarUrl={user?.avatar_url || ''}
            submitLabel="บันทึก"
            onSaved={(updated, avatarUrl) => {
              const merged = { ...target, ...updated };
              setTarget(merged);
              setPartnerProfile({ ...partnerProfile, ...updated });
              if (user && avatarUrl && avatarUrl !== user.avatar_url) {
                setUser({ ...user, avatar_url: avatarUrl });
              }
              setSavedFlash(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => setSavedFlash(false), 2000);
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
