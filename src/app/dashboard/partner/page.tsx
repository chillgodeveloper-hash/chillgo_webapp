'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Camera, ImagePlus, X, CheckCircle, ArrowRight, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { validateFile } from '@/lib/moderation';

export default function PartnerSetupPage() {
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [portfolioFiles, setPortfolioFiles] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [localPartnerProfile, setLocalPartnerProfile] = useState<any>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);
  const { user, partnerProfile, setPartnerProfile, setUser } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

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
      if (!pp && currentUser) {
        const { data } = await supabase.from('partner_profiles').select('*').eq('user_id', currentUser.id).single();
        if (data) { setPartnerProfile(data); pp = data; }
      }

      setLocalPartnerProfile(pp);
      if (pp) setBusinessName(pp.business_name || '');
      setPageLoading(false);
    };
    init();
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file, 'avatar');
    if (!validation.valid) { setError(validation.error || ''); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePortfolioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: typeof portfolioFiles = [];
    for (const file of files) {
      const validation = validateFile(file, 'image');
      if (!validation.valid) { setError(validation.error || ''); continue; }
      newFiles.push({ file, preview: URL.createObjectURL(file) });
    }
    setPortfolioFiles((prev) => [...prev, ...newFiles].slice(0, 10));
  };

  const handleSubmit = async () => {
    if (!user) { setError('กรุณาเข้าสู่ระบบ'); return; }
    if (!localPartnerProfile) { setError('ไม่พบข้อมูลพาร์ทเนอร์ กรุณาลองใหม่'); return; }
    setLoading(true);
    setError('');

    try {
      let avatarUrl = user.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('media').upload(path, avatarFile, { upsert: true });
        if (uploadErr) console.error('Avatar upload:', uploadErr);
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        avatarUrl = publicUrl;
        await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      }

      const portfolioUrls: string[] = [];
      for (const { file } of portfolioFiles) {
        const ext = file.name.split('.').pop();
        const path = `portfolio/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, file);
        if (upErr) { console.error('Portfolio upload:', upErr); continue; }
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        portfolioUrls.push(publicUrl);
      }

      const { error: updateErr } = await supabase
        .from('partner_profiles')
        .update({
          business_name: businessName || localPartnerProfile.business_name,
          description,
          portfolio_images: portfolioUrls,
        })
        .eq('id', localPartnerProfile.id);

      if (updateErr) throw updateErr;

      setPartnerProfile({
        ...localPartnerProfile,
        business_name: businessName || localPartnerProfile.business_name,
        description,
        portfolio_images: portfolioUrls,
      });

      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleSwitchToCustomer = async () => {
    if (!user) return;
    await supabase.from('partner_profiles').delete().eq('user_id', user.id);
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', user.id);
    setUser({ ...user, role: 'customer' });
    setPartnerProfile(null);
    router.push('/feed');
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <Loader2 size={40} className="text-secondary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleSwitchToCustomer}
            className="flex items-center gap-1.5 text-sm text-tmuted hover:text-secondary transition px-3 py-2 rounded-xl hover:bg-white/50"
          >
            <ArrowLeft size={16} /> เปลี่ยนเป็นลูกค้า
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-danger hover:text-danger/80 transition px-3 py-2 rounded-xl hover:bg-danger/5"
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-tmain">ตั้งค่าโปรไฟล์พาร์ทเนอร์</h1>
          <p className="text-tmuted mt-2">ขั้นตอนที่ {step} จาก 2</p>
          <div className="flex gap-2 justify-center mt-4">
            <div className={`h-1.5 w-16 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-primary-dark/30'}`} />
            <div className={`h-1.5 w-16 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-primary-dark/30'}`} />
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
            <h2 className="font-bold text-xl text-tmain mb-6">ข้อมูลพื้นฐาน</h2>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  onClick={() => avatarRef.current?.click()}
                  className="w-28 h-28 rounded-full bg-primary/10 border-3 border-primary flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-primary-text" />
                  )}
                </div>
                <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                <p className="text-xs text-tmuted text-center mt-2">อัปโหลดรูปโปรไฟล์</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-tmain mb-1 block">ชื่อธุรกิจ / ชื่อบริการ</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={partnerProfile?.business_name || ''}
                  className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-tmain mb-1 block">คำอธิบาย / แนะนำตัว</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เล่าเกี่ยวกับบริการของคุณ..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!avatarPreview}
              className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-3.5 rounded-2xl mt-6 transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              ถัดไป <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
            <h2 className="font-bold text-xl text-tmain mb-2">อัปโหลดผลงาน</h2>
            <p className="text-sm text-tmuted mb-6">เพิ่มรูปภาพผลงานของคุณ (อย่างน้อย 1 รูป)</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {portfolioFiles.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-primary/20">
                  <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPortfolioFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {portfolioFiles.length < 10 && (
                <button
                  onClick={() => portfolioRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-primary-dark/40 flex flex-col items-center justify-center text-tmuted hover:border-primary hover:text-primary transition"
                >
                  <ImagePlus size={24} />
                  <span className="text-xs mt-1">เพิ่มรูป</span>
                </button>
              )}
            </div>
            <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={handlePortfolioSelect} className="hidden" />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-primary/20 text-tmuted font-semibold py-3.5 rounded-2xl transition hover:bg-primary-dark/30"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleSubmit}
                disabled={portfolioFiles.length === 0 || loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={18} /> เสร็จสิ้น
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
