'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { validateFile } from '@/lib/moderation';
import { Camera, ImagePlus, X, Star, Loader2, Save, AlertTriangle } from 'lucide-react';

export type PartnerCategory = 'guide' | 'driver';

// ── Option sets (ChillGo_ProfileForms) ──────────────────────────────
const LANGUAGES = ['🇹🇭 ไทย', '🇬🇧 English', '🇨🇳 中文', '🇯🇵 日本語', '🇰🇷 한국어', 'อื่นๆ'];
const SPECIALTIES = ['🏛 ประวัติศาสตร์', '☕ คาเฟ่ฮอปปิ้ง', '📸 ถ่ายรูป', '🍜 Street Food', '🌿 ธรรมชาติ', '🛍 ช้อปปิ้ง', '🎨 ศิลปะ', '🏄 Adventure'];
const GUIDE_STYLES = ['สนุกสนาน', 'เน้นสาระ', 'เน้นความชิล', 'ครบจุด', 'ปรับตามกลุ่ม'];
const CLIENT_TYPES = ['👨‍👩‍👧 ครอบครัว', '💑 คู่รัก', '👯 กลุ่มเพื่อน', '💼 Corporate', '🎒 Solo'];
const EXPERIENCE = ['<1 ปี', '1–3 ปี', '3–5 ปี', '5–10 ปี', '>10 ปี'];

const AMENITIES = ['📶 WiFi', '🔌 ที่ชาร์จ USB', '💧 น้ำดื่ม', '❄️ แอร์เย็น', '🌬️ เครื่องฟอก', '🎵 เพลง'];
const PETS = ['ไม่รับ', 'รับได้ (แจ้งล่วงหน้า)', 'รับได้ทุกกรณี'];
const LUGGAGE = ['♿ รถเข็น', '🏄 อุปกรณ์กีฬา', '🧳 กระเป๋าใหญ่', '🚲 จักรยาน'];
const PUBLIC_LICENSE = ['มีใบขับขี่สาธารณะ', 'มีเฉพาะใบขับขี่ส่วนบุคคล'];
const INSURANCE = ['ชั้น 1', 'ชั้น 2+', 'ชั้น 2', 'ชั้น 3+'];
const DRIVING_EXP = ['1–3 ปี', '3–5 ปี', '5–10 ปี', '>10 ปี'];
const EXTRA_SERVICES = ['📷 เป็นตากล้อง', '🍽 จองร้านอาหาร', '🏨 จองที่พัก', '🗺 แนะนำเส้นทาง', '🛍 ช่วยขนของ'];

const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const ACCOUNT_TYPES = ['ออมทรัพย์', 'กระแสรายวัน', 'ฝากประจำ'];

// ── Reusable bits ───────────────────────────────────────────────────
function Section({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="border-b border-primary-dark/10 pb-2">
        <h3 className="font-bold text-tmain text-sm">{icon} {title}</h3>
        {sub && <p className="text-xs text-tmuted mt-0.5">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type, placeholder, optional, rows }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; optional?: boolean; rows?: number }) {
  return (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">{label}{optional && <span className="text-tmuted font-normal"> (ไม่บังคับ)</span>}</label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm resize-none" />
      ) : (
        <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm" />
      )}
    </div>
  );
}

function CheckGrid({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button key={item} type="button" onClick={() => onToggle(item)}
          className={`p-2.5 rounded-xl border text-xs text-left transition ${selected.includes(item) ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20 hover:bg-primary/10'}`}
        >{item}</button>
      ))}
    </div>
  );
}

function RadioRow({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button key={item} type="button" onClick={() => onChange(value === item ? '' : item)}
          className={`px-3 py-2 rounded-xl border text-xs transition ${value === item ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20 hover:bg-primary/10'}`}
        >{item}</button>
      ))}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(value === n ? 0 : n)}>
          <Star size={28} className={n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-primary-dark/30'} />
        </button>
      ))}
    </div>
  );
}

interface Props {
  category: PartnerCategory;
  profile: any;            // existing partner_profiles row (may be mostly empty on setup)
  userId: string;
  currentAvatarUrl?: string;
  submitLabel: string;
  onSaved: (updated: any, avatarUrl: string) => void;
}

export default function PartnerProfileForm({ category, profile, userId, currentAvatarUrl, submitLabel, onSaved }: Props) {
  const supabase = createClient();
  const isGuide = category === 'guide';

  const [form, setForm] = useState<Record<string, any>>(() => ({
    business_name: profile?.business_name || '',
    description: profile?.description || '',
    nickname: profile?.nickname || '',
    intro_video_url: profile?.intro_video_url || '',
    trips_done: profile?.trips_done?.toString() || '',
    languages_spoken: profile?.languages_spoken || [],
    specialties: profile?.specialties || [],
    guide_styles: profile?.guide_styles || [],
    coverage_area: profile?.coverage_area || '',
    motto: profile?.motto || '',
    client_types: profile?.client_types || [],
    max_group_size: profile?.max_group_size?.toString() || '',
    experience_years: profile?.experience_years || '',
    proud_story: profile?.proud_story || '',
    vehicle_brand: profile?.vehicle_brand || '',
    vehicle_model: profile?.vehicle_model || '',
    vehicle_year: profile?.vehicle_year?.toString() || '',
    vehicle_seats: profile?.vehicle_seats?.toString() || '',
    amenities: profile?.amenities || [],
    pets_policy: profile?.pets_policy || '',
    special_luggage: profile?.special_luggage || [],
    public_license: profile?.public_license || '',
    insurance_class: profile?.insurance_class || '',
    driving_experience_years: profile?.driving_experience_years || '',
    extra_services: profile?.extra_services || [],
    service_personality: profile?.service_personality || '',
    recommended_places: profile?.recommended_places || '',
    available_days: profile?.available_days || [],
    self_rating: profile?.self_rating || 0,
    bank_name: profile?.bank_name || '',
    bank_branch: profile?.bank_branch || '',
    account_name: profile?.account_name || '',
    account_number: profile?.account_number || '',
    account_type: profile?.account_type || '',
    promptpay: profile?.promptpay || '',
    terms_accepted: profile?.terms_accepted || false,
  }));

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl || '');
  const [existingPortfolio, setExistingPortfolio] = useState<string[]>(profile?.portfolio_images || []);
  const [newPortfolio, setNewPortfolio] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState<string[]>([]);

  const avatarRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));
  const toggle = (key: string, value: string) => setForm((p) => {
    const arr: string[] = p[key] || [];
    return { ...p, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
  });

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, 'avatar');
    if (!v.valid) { setError(v.error || ''); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onPortfolio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const next: typeof newPortfolio = [];
    for (const file of files) {
      const v = validateFile(file, 'image');
      if (!v.valid) { setError(v.error || ''); continue; }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setNewPortfolio((p) => [...p, ...next].slice(0, 12));
    if (portfolioRef.current) portfolioRef.current.value = '';
  };

  const numOrNull = (v: string) => (v ? parseInt(v) : null);

  // Per-section required-field validation. Returns the list of what's missing.
  const validate = (): string[] => {
    const m: string[] = [];
    const photoCount = existingPortfolio.length + newPortfolio.length;

    // รูปและวีดีโอ
    if (!avatarPreview) m.push(isGuide ? 'รูปโปรไฟล์' : 'รูปโปรไฟล์คนขับ');
    if (photoCount === 0) m.push(isGuide ? 'รูปขณะนำเที่ยว (อย่างน้อย 1 รูป)' : 'รูปรถ (อย่างน้อย 1 รูป)');
    // ข้อมูลโปรไฟล์
    if (!form.business_name?.trim()) m.push('ชื่อโปรไฟล์ / ชื่อบริการ');

    if (isGuide) {
      if (!form.nickname?.trim()) m.push('ชื่อเล่น / ฉายา');
      if (form.languages_spoken.length === 0) m.push('ภาษาที่สื่อสารได้');
      if (form.specialties.length === 0) m.push('ความถนัดพิเศษ');
      if (form.guide_styles.length === 0) m.push('สไตล์การนำเที่ยว');
      if (!form.coverage_area?.trim()) m.push('พื้นที่ที่ถนัด');
      if (form.client_types.length === 0) m.push('รับลูกค้าประเภท');
      if (!form.experience_years) m.push('ประสบการณ์นำเที่ยว');
    } else {
      if (!form.vehicle_brand?.trim()) m.push('ยี่ห้อรถ');
      if (!form.vehicle_model?.trim()) m.push('รุ่นรถ');
      if (!form.vehicle_seats) m.push('จำนวนที่นั่งสูงสุด');
      if (form.amenities.length === 0) m.push('สิ่งอำนวยความสะดวก');
      if (!form.pets_policy) m.push('การรับสัตว์เลี้ยง');
      if (!form.public_license) m.push('ใบขับขี่สาธารณะ');
      if (!form.insurance_class) m.push('ประกันภัยรถ');
      if (!form.driving_experience_years) m.push('ประสบการณ์ขับรถ');
    }

    // วันที่พร้อมให้บริการ
    if (form.available_days.length === 0) m.push('วันที่พร้อมให้บริการ');
    // บัญชีธนาคาร
    if (!form.bank_name?.trim()) m.push('ชื่อธนาคาร');
    if (!form.account_name?.trim()) m.push('ชื่อบัญชี');
    if (!form.account_number?.trim()) m.push('เลขที่บัญชี');
    // ยอมรับเงื่อนไข
    if (!form.terms_accepted) m.push('ยอมรับเงื่อนไขการให้บริการ');

    return m;
  };

  const handleSubmit = async () => {
    const miss = validate();
    if (miss.length > 0) {
      setMissing(miss);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Avatar
      let avatarUrl = currentAvatarUrl || '';
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${userId}.${ext}`;
        await supabase.storage.from('media').upload(path, avatarFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        avatarUrl = publicUrl;
        await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
      }

      // Portfolio (existing kept + new uploads)
      const portfolioUrls = [...existingPortfolio];
      for (const { file } of newPortfolio) {
        const ext = file.name.split('.').pop();
        const path = `portfolio/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, file);
        if (upErr) continue;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        portfolioUrls.push(publicUrl);
      }

      const updateData: any = {
        business_name: form.business_name || profile?.business_name || '',
        description: form.description || '',
        nickname: form.nickname || '',
        intro_video_url: form.intro_video_url || '',
        portfolio_images: portfolioUrls,
        available_days: form.available_days,
        self_rating: form.self_rating || null,
        bank_name: form.bank_name || '',
        bank_branch: form.bank_branch || '',
        account_name: form.account_name || '',
        account_number: form.account_number || '',
        account_type: form.account_type || '',
        promptpay: form.promptpay || '',
        terms_accepted: !!form.terms_accepted,
        terms_accepted_at: form.terms_accepted ? new Date().toISOString() : null,
      };

      if (isGuide) {
        updateData.trips_done = numOrNull(form.trips_done);
        updateData.languages_spoken = form.languages_spoken;
        updateData.specialties = form.specialties;
        updateData.guide_styles = form.guide_styles;
        updateData.coverage_area = form.coverage_area || '';
        updateData.motto = form.motto || '';
        updateData.client_types = form.client_types;
        updateData.max_group_size = numOrNull(form.max_group_size);
        updateData.experience_years = form.experience_years || '';
        updateData.proud_story = form.proud_story || '';
      } else {
        updateData.vehicle_brand = form.vehicle_brand || '';
        updateData.vehicle_model = form.vehicle_model || '';
        updateData.vehicle_year = numOrNull(form.vehicle_year);
        updateData.vehicle_seats = numOrNull(form.vehicle_seats);
        updateData.amenities = form.amenities;
        updateData.pets_policy = form.pets_policy || '';
        updateData.special_luggage = form.special_luggage;
        updateData.public_license = form.public_license || '';
        updateData.insurance_class = form.insurance_class || '';
        updateData.driving_experience_years = form.driving_experience_years || '';
        updateData.extra_services = form.extra_services;
        updateData.service_personality = form.service_personality || '';
        updateData.recommended_places = form.recommended_places || '';
      }

      const { error: updErr } = await supabase.from('partner_profiles').update(updateData).eq('id', profile.id);
      if (updErr) throw updErr;

      setExistingPortfolio(portfolioUrls);
      setNewPortfolio([]);
      onSaved(updateData, avatarUrl);
    } catch (err: any) {
      setError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const photoHint = isGuide ? 'แนะนำอย่างน้อย 2 รูป (รูปขณะนำเที่ยว)' : 'แนะนำอย่างน้อย 3 รูป (นอก + ใน)';
  const videoLabel = isGuide ? 'ลิงก์วีดีโอแนะนำตัว (Intro Video)' : 'ลิงก์วีดีโอรีวิวรถ (Car Review Video)';

  return (
    <div className="space-y-6">
      {error && <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 text-sm">{error}</div>}

      {/* Photos & Video */}
      <Section icon="📷" title="รูปและวีดีโอ" sub="Photos & Video">
        <div className="flex justify-center">
          <div className="text-center">
            <div onClick={() => avatarRef.current?.click()} className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition mx-auto">
              {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={28} className="text-primary-text" />}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={onAvatar} className="hidden" />
            <p className="text-xs text-tmuted mt-1.5">{isGuide ? 'รูปโปรไฟล์' : 'รูปโปรไฟล์คนขับ'}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-tmain mb-1">{isGuide ? 'รูปขณะนำเที่ยว / Action Photos' : 'รูปรถ / Car Photos'}</p>
          <p className="text-xs text-tmuted mb-2">{photoHint}</p>
          <div className="grid grid-cols-4 gap-2">
            {existingPortfolio.map((url, i) => (
              <div key={`e-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-primary/20">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setExistingPortfolio((p) => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"><X size={12} /></button>
              </div>
            ))}
            {newPortfolio.map((f, i) => (
              <div key={`n-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-primary/20 ring-2 ring-secondary">
                <img src={f.preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setNewPortfolio((p) => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"><X size={12} /></button>
              </div>
            ))}
            <button type="button" onClick={() => portfolioRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-primary-dark/40 flex flex-col items-center justify-center text-tmuted hover:border-primary hover:bg-primary/20 transition">
              <ImagePlus size={20} /><span className="text-[10px] mt-1">เพิ่มรูป</span>
            </button>
          </div>
          <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={onPortfolio} className="hidden" />
        </div>

        <Field label={videoLabel} value={form.intro_video_url} onChange={(v) => set('intro_video_url', v)} placeholder="วางลิงก์ YouTube / Google Drive (ไม่เกิน 1 นาที)" optional />
      </Section>

      {/* Business name + bio (needed by the app) */}
      <Section icon="🪪" title="ข้อมูลโปรไฟล์">
        <Field label="ชื่อโปรไฟล์ / ชื่อบริการ (Business Name)" value={form.business_name} onChange={(v) => set('business_name', v)} placeholder="เช่น น้องไกด์พาเที่ยวเชียงใหม่" />
        <Field label="แนะนำตัวสั้นๆ (Bio)" value={form.description} onChange={(v) => set('description', v)} placeholder="บอกเล่าเกี่ยวกับบริการของคุณ" optional rows={3} />
      </Section>

      {isGuide ? (
        <>
          {/* Basic info */}
          <Section icon="👤" title="ข้อมูลเบื้องต้น" sub="Basic Information">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อเล่น / ฉายา (Nickname)" value={form.nickname} onChange={(v) => set('nickname', v)} />
              <Field label="จำนวนทริปที่นำแล้ว (Trips Done)" value={form.trips_done} onChange={(v) => set('trips_done', v)} type="number" />
            </div>
            <div>
              <p className="text-sm font-medium text-tmain mb-2">ภาษาที่สื่อสารได้ (Languages)</p>
              <CheckGrid items={LANGUAGES} selected={form.languages_spoken} onToggle={(v) => toggle('languages_spoken', v)} />
            </div>
          </Section>

          {/* Specialty & Style */}
          <Section icon="⭐" title="ความถนัดและสไตล์" sub="Specialty & Style">
            <div>
              <p className="text-sm font-medium text-tmain mb-2">ความถนัดพิเศษ</p>
              <CheckGrid items={SPECIALTIES} selected={form.specialties} onToggle={(v) => toggle('specialties', v)} />
            </div>
            <div>
              <p className="text-sm font-medium text-tmain mb-2">สไตล์การนำเที่ยว</p>
              <CheckGrid items={GUIDE_STYLES} selected={form.guide_styles} onToggle={(v) => toggle('guide_styles', v)} />
            </div>
            <Field label="พื้นที่ที่ถนัด (Coverage Area)" value={form.coverage_area} onChange={(v) => set('coverage_area', v)} placeholder="เช่น เชียงใหม่, เชียงราย" />
            <Field label="คติประจำใจ (Motto)" value={form.motto} onChange={(v) => set('motto', v)} optional />
          </Section>

          {/* Client profile */}
          <Section icon="👥" title="ลูกค้าและกลุ่มที่รับ" sub="Client Profile">
            <div>
              <p className="text-sm font-medium text-tmain mb-2">รับลูกค้าประเภท</p>
              <CheckGrid items={CLIENT_TYPES} selected={form.client_types} onToggle={(v) => toggle('client_types', v)} />
            </div>
            <Field label="รับกลุ่มสูงสุด (Max Group Size) — คน" value={form.max_group_size} onChange={(v) => set('max_group_size', v)} type="number" />
            <div>
              <p className="text-sm font-medium text-tmain mb-2">ประสบการณ์นำเที่ยว</p>
              <RadioRow items={EXPERIENCE} value={form.experience_years} onChange={(v) => set('experience_years', v)} />
            </div>
          </Section>

          {/* Your story */}
          <Section icon="✨" title="เรื่องราวและความภูมิใจ" sub="Your Story">
            <Field label="ประสบการณ์ที่ภูมิใจที่สุด" value={form.proud_story} onChange={(v) => set('proud_story', v)} optional rows={3} />
            <div>
              <p className="text-sm font-medium text-tmain mb-1">คะแนนรีวิวเฉลี่ย (ประเมินตนเอง)</p>
              <StarRating value={form.self_rating} onChange={(v) => set('self_rating', v)} />
            </div>
          </Section>
        </>
      ) : (
        <>
          {/* Vehicle info */}
          <Section icon="🚗" title="ข้อมูลรถ" sub="Vehicle Information">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ยี่ห้อรถ (Brand)" value={form.vehicle_brand} onChange={(v) => set('vehicle_brand', v)} />
              <Field label="รุ่นรถ (Model)" value={form.vehicle_model} onChange={(v) => set('vehicle_model', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ปีที่ผลิต (Year)" value={form.vehicle_year} onChange={(v) => set('vehicle_year', v)} type="number" />
              <Field label="จำนวนที่นั่งสูงสุด (Max Seats)" value={form.vehicle_seats} onChange={(v) => set('vehicle_seats', v)} type="number" />
            </div>
          </Section>

          {/* Amenities */}
          <Section icon="🎁" title="สิ่งอำนวยความสะดวก" sub="Amenities">
            <div>
              <p className="text-sm font-medium text-tmain mb-2">สิ่งอำนวยความสะดวก</p>
              <CheckGrid items={AMENITIES} selected={form.amenities} onToggle={(v) => toggle('amenities', v)} />
            </div>
            <div>
              <p className="text-sm font-medium text-tmain mb-2">รับสัตว์เลี้ยง</p>
              <RadioRow items={PETS} value={form.pets_policy} onChange={(v) => set('pets_policy', v)} />
            </div>
            <div>
              <p className="text-sm font-medium text-tmain mb-2">รับสัมภาระพิเศษ</p>
              <CheckGrid items={LUGGAGE} selected={form.special_luggage} onToggle={(v) => toggle('special_luggage', v)} />
            </div>
          </Section>

          {/* Safety & License */}
          <Section icon="🛡️" title="ความปลอดภัยและใบอนุญาต" sub="Safety & License">
            <div>
              <p className="text-sm font-medium text-tmain mb-2">ใบขับขี่สาธารณะ</p>
              <RadioRow items={PUBLIC_LICENSE} value={form.public_license} onChange={(v) => set('public_license', v)} />
            </div>
            <div>
              <p className="text-sm font-medium text-tmain mb-2">ประกันภัยรถ (Insurance)</p>
              <RadioRow items={INSURANCE} value={form.insurance_class} onChange={(v) => set('insurance_class', v)} />
            </div>
            <div>
              <p className="text-sm font-medium text-tmain mb-2">ประสบการณ์ขับรถ</p>
              <RadioRow items={DRIVING_EXP} value={form.driving_experience_years} onChange={(v) => set('driving_experience_years', v)} />
            </div>
          </Section>

          {/* Extra services */}
          <Section icon="💫" title="บริการเสริมและไลฟ์สไตล์" sub="Extra Services">
            <div>
              <p className="text-sm font-medium text-tmain mb-2">บริการเสริม</p>
              <CheckGrid items={EXTRA_SERVICES} selected={form.extra_services} onToggle={(v) => toggle('extra_services', v)} />
            </div>
            <Field label="นิสัยขณะให้บริการ" value={form.service_personality} onChange={(v) => set('service_personality', v)} optional />
            <Field label="สถานที่ที่ชอบแนะนำ" value={form.recommended_places} onChange={(v) => set('recommended_places', v)} optional rows={2} />
            <div>
              <p className="text-sm font-medium text-tmain mb-1">คะแนนรีวิวเฉลี่ย (ประเมินตนเอง)</p>
              <StarRating value={form.self_rating} onChange={(v) => set('self_rating', v)} />
            </div>
          </Section>
        </>
      )}

      {/* Availability */}
      <Section icon="📅" title="วันที่พร้อมให้บริการ" sub="Availability">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button key={d} type="button" onClick={() => toggle('available_days', d)}
              className={`w-12 h-12 rounded-xl border text-sm font-medium transition ${form.available_days.includes(d) ? 'border-primary bg-primary/20' : 'border-primary-dark/20 hover:bg-primary/10'}`}
            >{d}</button>
          ))}
        </div>
      </Section>

      {/* Bank account (kept from old form) */}
      <Section icon="💰" title="บัญชีธนาคาร" sub="สำหรับรับเงินค่าบริการ">
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3">⚠ ชื่อบัญชีต้องตรงกับชื่อผู้สมัครเท่านั้น</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ชื่อธนาคาร" value={form.bank_name} onChange={(v) => set('bank_name', v)} />
          <Field label="สาขา" value={form.bank_branch} onChange={(v) => set('bank_branch', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ชื่อบัญชี" value={form.account_name} onChange={(v) => set('account_name', v)} />
          <Field label="เลขที่บัญชี" value={form.account_number} onChange={(v) => set('account_number', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-tmain mb-1 block">ประเภทบัญชี</label>
            <select value={form.account_type} onChange={(e) => set('account_type', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm bg-white">
              <option value="">เลือก...</option>
              {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Field label="PromptPay" value={form.promptpay} onChange={(v) => set('promptpay', v)} />
        </div>
      </Section>

      <div className="bg-primary-light rounded-xl p-3 text-xs text-tmuted">
        💰 ราคาตามมาตรฐานของ ChillGo · ติดต่อและจองผ่าน ChillGo แอป / เว็บเท่านั้น 🔒
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={!!form.terms_accepted} onChange={(e) => set('terms_accepted', e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
        <span className="text-xs text-tmain">ฉันยอมรับเงื่อนไขการให้บริการและยืนยันว่าข้อมูลทั้งหมดเป็นความจริง</span>
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-40"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18} /> {submitLabel}</>}
      </button>

      {/* Incomplete-form popup */}
      {missing.length > 0 && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMissing([])} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 animate-slide-up">
            <div className="w-14 h-14 bg-warning/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={28} className="text-warning" />
            </div>
            <h3 className="text-lg font-bold text-tmain text-center mb-1">กรอกข้อมูลไม่ครบ</h3>
            <p className="text-sm text-tmuted text-center mb-4">กรุณากรอกข้อมูลต่อไปนี้ให้ครบก่อนลงทะเบียน</p>
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 max-h-52 overflow-y-auto">
              <ul className="space-y-1.5">
                {missing.map((item) => (
                  <li key={item} className="text-sm text-tmain flex items-start gap-2">
                    <span className="text-warning mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setMissing([])}
              className="w-full mt-4 bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold py-3 rounded-2xl transition"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
