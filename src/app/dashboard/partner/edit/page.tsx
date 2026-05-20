'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { validateFile } from '@/lib/moderation';
import {
  ArrowLeft, Save, Camera, X, ImagePlus, Check,
  User as UserIcon, Phone, Languages, Briefcase, CreditCard, FileText, Loader2,
} from 'lucide-react';

const LANG_LIST = ['ภาษาไทย', 'ภาษาจีนกลาง', 'ภาษาอังกฤษ'];
const LANG_LEVELS = ['ดีมาก', 'ดี', 'พอใช้', 'ไม่ได้'];

const GUIDE_STYLES = ['สายลุย / Adventure', 'สายประวัติศาสตร์ / Cultural', 'สายกิน / Street Food', 'สายถ่ายรูป / Cafe Hopping', 'สายช้อปปิ้ง / Shopping', 'สาย Nightlife', 'สาย Family / เด็ก', 'สาย Eco / ธรรมชาติ'];
const GUIDE_SKILLS = ['ถ่ายรูปสวย / รู้มุม', 'ตัดต่อ Reels / TikTok', 'บินโดรน / Drone', 'เล่าเรื่องสนุก / Storytelling', 'ร้องเพลง / เล่นดนตรี', 'เอ็นเตอร์เทนเก่ง / มีมุก', 'ขับรถ / มีรถส่วนตัว', 'นำเที่ยวกลางคืน / Night Tour'];
const DRIVER_STYLES = ['เน้นความปลอดภัย / Safety First', 'สายเอ็นเตอร์เทน / Entertaining', 'สุภาพ / ส่วนตัว / Formal & Private', 'สายลุย / Adventure'];
const DRIVER_SKILLS = ['ถ่ายภาพ / รู้มุม', 'ตัดต่อ Reels / TikTok', 'ไกด์ท้องถิ่น / Local Guide', 'ขับออฟโรด / 4WD', 'เล่าเรื่องสนุก / Storytelling', 'เอ็นเตอร์เทนเก่ง / มีมุก', 'ร้องเพลง / เล่นดนตรี', 'ปฐมพยาบาล / First Aid'];
const TRANSLATOR_SPECS = ['General — บทความทั่วไป', 'Legal — สัญญา / เอกสารราชการ', 'Technical — คู่มือ / IT', 'Business / Marketing', 'Academic — งานวิจัย / บทคัดย่อ', 'Medical / Science', 'Creative / Subtitle', 'Tourism / Hospitality'];
const TRANSLATOR_SKILLS = ['พิมพ์สัมผัส / Touch Typing', 'ความรู้ด้าน SEO Content', 'สรุปใจความ / Summarizing', 'Proofreading / Copy Editing', 'DTP / Layout (InDesign)', 'Voice-over / Dubbing Script', 'Localization', 'Machine Translation Post-Edit'];
const ACCOUNT_TYPES = ['ออมทรัพย์', 'กระแสรายวัน', 'ฝากประจำ'];

type TabKey = 'basic' | 'contact' | 'skills' | 'portfolio' | 'bank' | 'docs';

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm" />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm resize-none" />
    </div>
  );
}

function CheckboxGrid({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (item: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={`p-2.5 rounded-xl border text-xs text-left transition ${selected.includes(item) ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20 hover:bg-primary/10'}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default function PartnerEditPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser, partnerProfile, setPartnerProfile } = useAuthStore();

  const [tab, setTab] = useState<TabKey>('basic');
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  // Partner profile fields (initialized from DB)
  const [pp, setPP] = useState<Record<string, any>>({});
  const [newPortfolioFiles, setNewPortfolioFiles] = useState<{ file: File; preview: string }[]>([]);
  const portfolioRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      setFullName(user.full_name || '');
      setAvatarPreview(user.avatar_url || '');

      if (user.role !== 'partner') {
        router.replace('/feed');
        return;
      }

      // Fetch the active partner profile fresh
      const activeId = typeof window !== 'undefined' ? localStorage.getItem('active_partner_id') : null;
      let target = partnerProfile;
      if (activeId) {
        const { data } = await supabase.from('partner_profiles').select('*').eq('id', activeId).maybeSingle();
        if (data) target = data;
      }
      if (!target) {
        const { data } = await supabase.from('partner_profiles').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (data) target = data;
      }
      if (target) {
        setPartnerProfile(target);
        const t = target as any;
        setPP({
          ...t,
          languages: t.languages || {},
          skills: t.skills || [],
          service_styles: t.service_styles || [],
          certifications: t.certifications || [],
          education: t.education || [],
          work_experience: t.work_experience || [],
          translation_specializations: t.translation_specializations || [],
          translation_pairs: t.translation_pairs || [],
          test_scores: t.test_scores || [],
          portfolio_images: t.portfolio_images || [],
        });
      }
      setPageLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const set = (key: string, value: any) => setPP((prev) => ({ ...prev, [key]: value }));
  const toggle = (key: string, value: string) => setPP((prev) => {
    const arr: string[] = prev[key] || [];
    return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
  });
  const setLang = (lang: string, level: string) => setPP((prev) => ({ ...prev, languages: { ...(prev.languages || {}), [lang]: level } }));

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, 'avatar');
    if (!v.valid) { setError(v.error || ''); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePortfolioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newOnes: typeof newPortfolioFiles = [];
    for (const f of files) {
      const v = validateFile(f, 'image');
      if (!v.valid) { setError(v.error || ''); continue; }
      newOnes.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setNewPortfolioFiles((prev) => [...prev, ...newOnes]);
    if (portfolioRef.current) portfolioRef.current.value = '';
  };

  const removeExistingPortfolio = (idx: number) => {
    set('portfolio_images', (pp.portfolio_images || []).filter((_: any, i: number) => i !== idx));
  };

  const handleSave = async () => {
    if (!user || !partnerProfile) return;
    setSaving(true);
    setError('');
    try {
      // 1. Upload avatar if changed
      let avatarUrl = user.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}.${ext}`;
        await supabase.storage.from('media').upload(path, avatarFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        avatarUrl = publicUrl;
      }

      // 2. Update profile name + avatar
      await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', user.id);
      setUser({ ...user, full_name: fullName, avatar_url: avatarUrl });

      // 3. Upload new portfolio images and append to existing
      const portfolioUrls: string[] = [...(pp.portfolio_images || [])];
      for (const { file } of newPortfolioFiles) {
        const ext = file.name.split('.').pop();
        const path = `portfolio/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, file);
        if (upErr) continue;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        portfolioUrls.push(publicUrl);
      }

      // 4. Save partner_profile fields. Only include columns that exist for this category
      // to avoid spurious updates to NULL columns.
      const base: Record<string, any> = {
        business_name: pp.business_name || '',
        description: pp.description || '',
        full_name_th: pp.full_name_th || '',
        full_name_en: pp.full_name_en || '',
        nickname: pp.nickname || '',
        age: pp.age ? parseInt(String(pp.age)) : null,
        id_number: pp.id_number || '',
        date_of_birth: pp.date_of_birth || null,
        nationality: pp.nationality || '',
        marital_status: pp.marital_status || '',
        phone: pp.phone || '',
        line_id: pp.line_id || '',
        wechat_id: pp.wechat_id || '',
        contact_email: pp.contact_email || '',
        address: pp.address || '',
        province: pp.province || '',
        postcode: pp.postcode || '',
        languages: pp.languages || {},
        skills: pp.skills || [],
        service_styles: pp.service_styles || [],
        special_routes: pp.special_routes || '',
        bank_name: pp.bank_name || '',
        bank_branch: pp.bank_branch || '',
        account_name: pp.account_name || '',
        account_number: pp.account_number || '',
        account_type: pp.account_type || '',
        promptpay: pp.promptpay || '',
        portfolio_images: portfolioUrls,
      };

      if (partnerProfile.category === 'guide') {
        base.guide_license_no = pp.guide_license_no || '';
        base.guide_license_type = pp.guide_license_type || '';
        base.education = pp.education || [];
        base.certifications = pp.certifications || [];
        base.work_experience = pp.work_experience || [];
      }
      if (partnerProfile.category === 'driver') {
        base.driving_license_type = pp.driving_license_type || '';
        base.driving_license_no = pp.driving_license_no || '';
        base.driving_license_expiry = pp.driving_license_expiry || null;
        base.vehicle_brand = pp.vehicle_brand || '';
        base.vehicle_color = pp.vehicle_color || '';
        base.vehicle_plate = pp.vehicle_plate || '';
        base.vehicle_plate_province = pp.vehicle_plate_province || '';
        base.vehicle_year = pp.vehicle_year ? parseInt(String(pp.vehicle_year)) : null;
        base.vehicle_seats = pp.vehicle_seats ? parseInt(String(pp.vehicle_seats)) : null;
        base.vehicle_plate_type = pp.vehicle_plate_type || '';
        base.vehicle_insurance_compulsory = pp.vehicle_insurance_compulsory || '';
        base.vehicle_insurance_compulsory_expiry = pp.vehicle_insurance_compulsory_expiry || null;
        base.vehicle_insurance_voluntary = pp.vehicle_insurance_voluntary || '';
      }
      if (partnerProfile.category === 'translator') {
        base.passport_no = pp.passport_no || '';
        base.education_level = pp.education_level || '';
        base.education_major = pp.education_major || '';
        base.translation_specializations = pp.translation_specializations || [];
        base.translation_pairs = pp.translation_pairs || [];
        base.test_scores = pp.test_scores || [];
        base.daily_capacity = pp.daily_capacity || '';
        base.rate_per_word = pp.rate_per_word || '';
        base.working_hours = pp.working_hours || '';
        base.rush_job_available = !!pp.rush_job_available;
      }

      const { error: updateErr } = await supabase
        .from('partner_profiles')
        .update(base)
        .eq('id', partnerProfile.id);
      if (updateErr) throw updateErr;

      setPartnerProfile({ ...partnerProfile, ...base });
      setPP((prev) => ({ ...prev, portfolio_images: portfolioUrls }));
      setNewPortfolioFiles([]);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err: any) {
      setError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 size={32} className="text-secondary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const cat = partnerProfile?.category;
  const catLabel = cat === 'guide' ? 'ไกด์นำเที่ยว' : cat === 'driver' ? 'คนขับรถ' : 'ล่าม / นักแปล';

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'basic', label: 'ข้อมูลพื้นฐาน', icon: UserIcon },
    { key: 'contact', label: 'ติดต่อ', icon: Phone },
    { key: 'skills', label: 'ทักษะ & ภาษา', icon: Languages },
    { key: 'portfolio', label: 'ผลงาน', icon: Briefcase },
    { key: 'bank', label: 'บัญชีธนาคาร', icon: CreditCard },
    { key: 'docs', label: 'เอกสาร & ใบอนุญาต', icon: FileText },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8 animate-blur-in">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-tmuted hover:bg-primary/20 px-3 py-2 rounded-xl transition">
            <ArrowLeft size={16} /> ย้อนกลับ
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold px-5 py-2 rounded-xl transition disabled:opacity-40 shadow-sm"
          >
            {saving ? <div className="w-4 h-4 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" /> : savedFlash ? <><Check size={16} /> บันทึกแล้ว</> : <><Save size={16} /> บันทึก</>}
          </button>
        </div>

        <h1 className="text-2xl font-bold text-tmain">แก้ไขโปรไฟล์ {catLabel}</h1>
        <p className="text-sm text-tmuted mt-1">แก้ไขข้อมูลแล้วกดบันทึก</p>

        {error && <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mt-4 text-sm">{error}</div>}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${tab === t.key ? 'bg-primary text-dark-DEFAULT shadow-sm' : 'bg-white border border-primary-dark/20 text-tmain hover:bg-primary/10'}`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-primary-dark/20 p-5 lg:p-6 space-y-4">
          {tab === 'basic' && (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <div onClick={() => avatarRef.current?.click()} className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition border-2 border-primary/30">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={28} className="text-primary-text" />}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white cursor-pointer" onClick={() => avatarRef.current?.click()}>
                    <Camera size={14} className="text-dark-DEFAULT" />
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                </div>
              </div>
              <Input label="ชื่อ-นามสกุล (บัญชี)" value={fullName} onChange={setFullName} />
              <Input label="อีเมล" value={user?.email || ''} onChange={() => {}} />
              <hr className="border-primary-dark/10" />
              <Input label="ชื่อธุรกิจ / ชื่อบริการ" value={pp.business_name || ''} onChange={(v) => set('business_name', v)} />
              <Textarea label="คำอธิบาย / แนะนำตัว" value={pp.description || ''} onChange={(v) => set('description', v)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="ชื่อ-นามสกุล (ไทย)" value={pp.full_name_th || ''} onChange={(v) => set('full_name_th', v)} />
                <Input label="Name-Surname (English)" value={pp.full_name_en || ''} onChange={(v) => set('full_name_en', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="ชื่อเล่น" value={pp.nickname || ''} onChange={(v) => set('nickname', v)} />
                <Input label="อายุ" type="number" value={pp.age?.toString() || ''} onChange={(v) => set('age', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="เลขบัตรประชาชน" value={pp.id_number || ''} onChange={(v) => set('id_number', v)} />
                <Input label="วันเกิด" type="date" value={pp.date_of_birth || ''} onChange={(v) => set('date_of_birth', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="สัญชาติ" value={pp.nationality || ''} onChange={(v) => set('nationality', v)} />
                {cat === 'guide' && <Input label="สถานภาพ" value={pp.marital_status || ''} onChange={(v) => set('marital_status', v)} />}
              </div>
            </>
          )}

          {tab === 'contact' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="เบอร์โทรศัพท์" value={pp.phone || ''} onChange={(v) => set('phone', v)} />
                <Input label="LINE ID" value={pp.line_id || ''} onChange={(v) => set('line_id', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="WeChat ID" value={pp.wechat_id || ''} onChange={(v) => set('wechat_id', v)} />
                <Input label="Email ติดต่อ" type="email" value={pp.contact_email || ''} onChange={(v) => set('contact_email', v)} />
              </div>
              <Textarea label="ที่อยู่ปัจจุบัน" value={pp.address || ''} onChange={(v) => set('address', v)} rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="จังหวัด" value={pp.province || ''} onChange={(v) => set('province', v)} />
                <Input label="รหัสไปรษณีย์" value={pp.postcode || ''} onChange={(v) => set('postcode', v)} />
              </div>
            </>
          )}

          {tab === 'skills' && (
            <>
              <div>
                <p className="text-sm font-semibold text-tmain mb-2">ภาษา</p>
                {LANG_LIST.map((lang) => (
                  <div key={lang} className="mb-3">
                    <p className="text-sm font-medium text-tmain mb-1.5">{lang}</p>
                    <div className="flex gap-2">
                      {LANG_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setLang(lang, level)}
                          className={`flex-1 py-2 rounded-lg border text-xs transition ${pp.languages?.[lang] === level ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {cat === 'translator' ? (
                <>
                  <hr className="border-primary-dark/10" />
                  <div>
                    <p className="text-sm font-semibold text-tmain mb-2">หมวดงานที่เชี่ยวชาญ</p>
                    <CheckboxGrid items={TRANSLATOR_SPECS} selected={pp.translation_specializations || []} onToggle={(v) => toggle('translation_specializations', v)} />
                  </div>
                  <hr className="border-primary-dark/10" />
                  <div>
                    <p className="text-sm font-semibold text-tmain mb-2">ทักษะพิเศษ</p>
                    <CheckboxGrid items={TRANSLATOR_SKILLS} selected={pp.skills || []} onToggle={(v) => toggle('skills', v)} />
                  </div>
                </>
              ) : (
                <>
                  <hr className="border-primary-dark/10" />
                  <div>
                    <p className="text-sm font-semibold text-tmain mb-2">{cat === 'guide' ? 'สไตล์การนำเที่ยว' : 'สไตล์การบริการ'}</p>
                    <CheckboxGrid items={cat === 'guide' ? GUIDE_STYLES : DRIVER_STYLES} selected={pp.service_styles || []} onToggle={(v) => toggle('service_styles', v)} />
                  </div>
                  <hr className="border-primary-dark/10" />
                  <div>
                    <p className="text-sm font-semibold text-tmain mb-2">ทักษะพิเศษ</p>
                    <CheckboxGrid items={cat === 'guide' ? GUIDE_SKILLS : DRIVER_SKILLS} selected={pp.skills || []} onToggle={(v) => toggle('skills', v)} />
                  </div>
                </>
              )}

              <Textarea label="เส้นทาง / พื้นที่ให้บริการ" value={pp.special_routes || ''} onChange={(v) => set('special_routes', v)} rows={2} />
            </>
          )}

          {tab === 'portfolio' && (
            <>
              <Textarea label="คำอธิบาย / แนะนำตัว" value={pp.description || ''} onChange={(v) => set('description', v)} rows={4} />
              <div>
                <p className="text-sm font-medium text-tmain mb-2">รูปผลงาน</p>
                <div className="grid grid-cols-4 gap-2">
                  {(pp.portfolio_images || []).map((url: string, i: number) => (
                    <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-primary/20">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeExistingPortfolio(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"><X size={12} /></button>
                    </div>
                  ))}
                  {newPortfolioFiles.map((f, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-primary/20 ring-2 ring-secondary">
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setNewPortfolioFiles((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"><X size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => portfolioRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-primary-dark/40 flex flex-col items-center justify-center text-tmuted hover:border-primary hover:bg-primary/20 transition">
                    <ImagePlus size={20} /><span className="text-[10px] mt-1">เพิ่มรูป</span>
                  </button>
                </div>
                <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={handlePortfolioSelect} className="hidden" />
                <p className="text-xs text-tmuted mt-2">รูปที่ติด ring สีคือยังไม่ได้บันทึก — กด "บันทึก" เพื่ออัปโหลด</p>
              </div>
            </>
          )}

          {tab === 'bank' && (
            <>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3">⚠ ชื่อบัญชีต้องตรงกับชื่อผู้สมัครเท่านั้น</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="ชื่อธนาคาร" value={pp.bank_name || ''} onChange={(v) => set('bank_name', v)} />
                <Input label="สาขา" value={pp.bank_branch || ''} onChange={(v) => set('bank_branch', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="ชื่อบัญชี" value={pp.account_name || ''} onChange={(v) => set('account_name', v)} />
                <Input label="เลขที่บัญชี" value={pp.account_number || ''} onChange={(v) => set('account_number', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-tmain mb-1 block">ประเภทบัญชี</label>
                  <select value={pp.account_type || ''} onChange={(e) => set('account_type', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm bg-white">
                    <option value="">เลือก...</option>
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Input label="PromptPay" value={pp.promptpay || ''} onChange={(v) => set('promptpay', v)} />
              </div>
            </>
          )}

          {tab === 'docs' && (
            <>
              {cat === 'guide' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="เลขใบอนุญาตไกด์" value={pp.guide_license_no || ''} onChange={(v) => set('guide_license_no', v)} />
                    <Input label="ประเภทใบอนุญาต" value={pp.guide_license_type || ''} onChange={(v) => set('guide_license_type', v)} />
                  </div>
                  <hr className="border-primary-dark/10" />
                  <div>
                    <p className="text-sm font-semibold text-tmain mb-2">ใบรับรอง</p>
                    <CheckboxGrid
                      items={['ใบอนุญาตมัคคุเทศก์ (Thai Guide)', 'CPR / First Aid Certificate', 'Chinese Proficiency (HSK / อื่นๆ)', 'English (IELTS / TOEIC / อื่นๆ)']}
                      selected={pp.certifications || []}
                      onToggle={(v) => toggle('certifications', v)}
                    />
                  </div>
                </>
              )}

              {cat === 'driver' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-tmain mb-2 block">ประเภทใบอนุญาตขับขี่</label>
                    <div className="flex gap-2">
                      {['ส่วนบุคคล (ตลอดชีพ/5ปี)', 'สาธารณะ (เล่มเหลือง)'].map((t) => (
                        <button key={t} type="button" onClick={() => set('driving_license_type', t)} className={`flex-1 p-2.5 rounded-xl border text-xs transition ${pp.driving_license_type === t ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="เลขที่ใบขับขี่" value={pp.driving_license_no || ''} onChange={(v) => set('driving_license_no', v)} />
                    <Input label="วันหมดอายุ" type="date" value={pp.driving_license_expiry || ''} onChange={(v) => set('driving_license_expiry', v)} />
                  </div>
                  <hr className="border-primary-dark/10" />
                  <p className="text-sm font-semibold text-tmain">ข้อมูลรถ</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="ยี่ห้อ / รุ่น" value={pp.vehicle_brand || ''} onChange={(v) => set('vehicle_brand', v)} />
                    <Input label="สีรถ" value={pp.vehicle_color || ''} onChange={(v) => set('vehicle_color', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="เลขทะเบียนรถ" value={pp.vehicle_plate || ''} onChange={(v) => set('vehicle_plate', v)} />
                    <Input label="จังหวัด (ทะเบียน)" value={pp.vehicle_plate_province || ''} onChange={(v) => set('vehicle_plate_province', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="ปีจดทะเบียน" type="number" value={pp.vehicle_year?.toString() || ''} onChange={(v) => set('vehicle_year', v)} />
                    <Input label="จำนวนที่นั่ง" type="number" value={pp.vehicle_seats?.toString() || ''} onChange={(v) => set('vehicle_seats', v)} />
                  </div>
                  <Input label="ประเภทป้ายทะเบียน" value={pp.vehicle_plate_type || ''} onChange={(v) => set('vehicle_plate_type', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="สถานะ พ.ร.บ." value={pp.vehicle_insurance_compulsory || ''} onChange={(v) => set('vehicle_insurance_compulsory', v)} />
                    <Input label="วันสิ้นสุด พ.ร.บ." type="date" value={pp.vehicle_insurance_compulsory_expiry || ''} onChange={(v) => set('vehicle_insurance_compulsory_expiry', v)} />
                  </div>
                  <Input label="ประกันภัยภาคสมัครใจ" value={pp.vehicle_insurance_voluntary || ''} onChange={(v) => set('vehicle_insurance_voluntary', v)} />
                </>
              )}

              {cat === 'translator' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Passport No." value={pp.passport_no || ''} onChange={(v) => set('passport_no', v)} />
                    <Input label="ระดับการศึกษา" value={pp.education_level || ''} onChange={(v) => set('education_level', v)} />
                  </div>
                  <Input label="สาขาวิชา" value={pp.education_major || ''} onChange={(v) => set('education_major', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="ปริมาณงานต่อวัน" value={pp.daily_capacity || ''} onChange={(v) => set('daily_capacity', v)} />
                    <Input label="ค่าจ้างต่อคำ" value={pp.rate_per_word || ''} onChange={(v) => set('rate_per_word', v)} />
                  </div>
                  <Input label="เวลาทำงาน" value={pp.working_hours || ''} onChange={(v) => set('working_hours', v)} />
                  <label className="flex items-center gap-2 text-sm text-tmain">
                    <input type="checkbox" checked={!!pp.rush_job_available} onChange={(e) => set('rush_job_available', e.target.checked)} className="w-4 h-4 accent-primary" />
                    รับงานด่วน
                  </label>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
