'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Camera, ImagePlus, X, CheckCircle, ArrowRight, ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { validateFile } from '@/lib/moderation';

const LANG_LIST = ['ภาษาไทย', 'ภาษาจีนกลาง', 'ภาษาอังกฤษ'];
const LANG_LEVELS = ['ดีมาก', 'ดี', 'พอใช้', 'ไม่ได้'];

const GUIDE_STYLES = ['สายลุย / Adventure', 'สายประวัติศาสตร์ / Cultural', 'สายกิน / Street Food', 'สายถ่ายรูป / Cafe Hopping', 'สายช้อปปิ้ง / Shopping', 'สาย Nightlife', 'สาย Family / เด็ก', 'สาย Eco / ธรรมชาติ'];
const GUIDE_SKILLS = ['ถ่ายรูปสวย / รู้มุม', 'ตัดต่อ Reels / TikTok', 'บินโดรน / Drone', 'เล่าเรื่องสนุก / Storytelling', 'ร้องเพลง / เล่นดนตรี', 'เอ็นเตอร์เทนเก่ง / มีมุก', 'ขับรถ / มีรถส่วนตัว', 'นำเที่ยวกลางคืน / Night Tour'];

const DRIVER_STYLES = ['เน้นความปลอดภัย / Safety First', 'สายเอ็นเตอร์เทน / Entertaining', 'สุภาพ / ส่วนตัว / Formal & Private', 'สายลุย / Adventure'];
const DRIVER_SKILLS = ['ถ่ายภาพ / รู้มุม', 'ตัดต่อ Reels / TikTok', 'ไกด์ท้องถิ่น / Local Guide', 'ขับออฟโรด / 4WD', 'เล่าเรื่องสนุก / Storytelling', 'เอ็นเตอร์เทนเก่ง / มีมุก', 'ร้องเพลง / เล่นดนตรี', 'ปฐมพยาบาล / First Aid'];

const TRANSLATOR_SPECS = ['General — บทความทั่วไป', 'Legal — สัญญา / เอกสารราชการ', 'Technical — คู่มือ / IT', 'Business / Marketing', 'Academic — งานวิจัย / บทคัดย่อ', 'Medical / Science', 'Creative / Subtitle', 'Tourism / Hospitality'];
const TRANSLATOR_SKILLS = ['พิมพ์สัมผัส / Touch Typing', 'ความรู้ด้าน SEO Content', 'สรุปใจความ / Summarizing', 'Proofreading / Copy Editing', 'DTP / Layout (InDesign)', 'Voice-over / Dubbing Script', 'Localization', 'Machine Translation Post-Edit'];

type FormData = Record<string, any>;

export default function PartnerSetupPage() {
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [portfolioFiles, setPortfolioFiles] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [localPartnerProfile, setLocalPartnerProfile] = useState<any>(null);
  const [form, setForm] = useState<FormData>({
    business_name: '', description: '',
    full_name_th: '', full_name_en: '', nickname: '', age: '', id_number: '', date_of_birth: '',
    nationality: 'ไทย', phone: '', line_id: '', wechat_id: '', contact_email: '', address: '', province: '', postcode: '',
    languages: {} as Record<string, string>, other_language: '', other_language_level: '',
    skills: [] as string[], service_styles: [] as string[], special_routes: '',
    bank_name: '', bank_branch: '', account_name: '', account_number: '', account_type: '', promptpay: '',
    guide_license_no: '', guide_license_type: '', marital_status: '',
    driving_license_type: '', driving_license_no: '', driving_license_expiry: '',
    vehicle_brand: '', vehicle_color: '', vehicle_plate: '', vehicle_plate_province: '', vehicle_year: '', vehicle_seats: '',
    vehicle_plate_type: '', vehicle_insurance_compulsory: '', vehicle_insurance_compulsory_expiry: '', vehicle_insurance_voluntary: '',
    passport_no: '', education_level: '', education_major: '',
    translation_specializations: [] as string[],
    daily_capacity: '', rate_per_word: '', working_hours: '', rush_job_available: false,
    terms_accepted: false,
  });

  const avatarRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);
  const { user, partnerProfile, setPartnerProfile, setUser } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const category = localPartnerProfile?.category || 'guide';
  const totalSteps = category === 'guide' ? 5 : category === 'driver' ? 5 : 5;

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
      if (pp) setForm(prev => ({ ...prev, business_name: pp.business_name || '' }));
      setPageLoading(false);
    };
    init();
  }, []);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleArray = (key: string, value: string) => {
    setForm(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] };
    });
  };
  const updateLang = (lang: string, level: string) => {
    setForm(prev => ({ ...prev, languages: { ...prev.languages, [lang]: level } }));
  };

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
    setPortfolioFiles(prev => [...prev, ...newFiles].slice(0, 10));
  };

  const handleSubmit = async () => {
    if (!user || !localPartnerProfile) return;
    setLoading(true);
    setError('');
    try {
      let avatarUrl = user.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}.${ext}`;
        await supabase.storage.from('media').upload(path, avatarFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        avatarUrl = publicUrl;
        await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      }
      const portfolioUrls: string[] = [];
      for (const { file } of portfolioFiles) {
        const ext = file.name.split('.').pop();
        const path = `portfolio/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, file);
        if (upErr) continue;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        portfolioUrls.push(publicUrl);
      }

      const langData = { ...form.languages };
      if (form.other_language && form.other_language_level) {
        langData[form.other_language] = form.other_language_level;
      }

      const updateData: any = {
        business_name: form.business_name || localPartnerProfile.business_name,
        description: form.description,
        portfolio_images: portfolioUrls,
        full_name_th: form.full_name_th, full_name_en: form.full_name_en, nickname: form.nickname,
        age: form.age ? parseInt(form.age) : null, id_number: form.id_number, date_of_birth: form.date_of_birth || null,
        nationality: form.nationality, phone: form.phone, line_id: form.line_id,
        wechat_id: form.wechat_id, contact_email: form.contact_email, address: form.address,
        province: form.province, postcode: form.postcode, languages: langData,
        skills: form.skills, service_styles: form.service_styles, special_routes: form.special_routes,
        bank_name: form.bank_name, bank_branch: form.bank_branch, account_name: form.account_name,
        account_number: form.account_number, account_type: form.account_type, promptpay: form.promptpay,
        terms_accepted: form.terms_accepted, terms_accepted_at: form.terms_accepted ? new Date().toISOString() : null,
      };

      if (category === 'guide') {
        updateData.guide_license_no = form.guide_license_no;
        updateData.guide_license_type = form.guide_license_type;
        updateData.marital_status = form.marital_status;
      }
      if (category === 'driver') {
        updateData.driving_license_type = form.driving_license_type;
        updateData.driving_license_no = form.driving_license_no;
        updateData.driving_license_expiry = form.driving_license_expiry || null;
        updateData.vehicle_brand = form.vehicle_brand;
        updateData.vehicle_color = form.vehicle_color;
        updateData.vehicle_plate = form.vehicle_plate;
        updateData.vehicle_plate_province = form.vehicle_plate_province;
        updateData.vehicle_year = form.vehicle_year ? parseInt(form.vehicle_year) : null;
        updateData.vehicle_seats = form.vehicle_seats ? parseInt(form.vehicle_seats) : null;
        updateData.vehicle_plate_type = form.vehicle_plate_type;
        updateData.vehicle_insurance_compulsory = form.vehicle_insurance_compulsory;
        updateData.vehicle_insurance_compulsory_expiry = form.vehicle_insurance_compulsory_expiry || null;
        updateData.vehicle_insurance_voluntary = form.vehicle_insurance_voluntary;
      }
      if (category === 'translator') {
        updateData.passport_no = form.passport_no;
        updateData.education_level = form.education_level;
        updateData.education_major = form.education_major;
        updateData.translation_specializations = form.translation_specializations;
        updateData.daily_capacity = form.daily_capacity;
        updateData.rate_per_word = form.rate_per_word;
        updateData.working_hours = form.working_hours;
        updateData.rush_job_available = form.rush_job_available;
      }

      const { error: updateErr } = await supabase.from('partner_profiles').update(updateData).eq('id', localPartnerProfile.id);
      if (updateErr) throw updateErr;
      setPartnerProfile({ ...localPartnerProfile, ...updateData });
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth/login'); };
  const handleSwitchToCustomer = async () => {
    if (!user) return;
    await supabase.from('partner_profiles').delete().eq('user_id', user.id);
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', user.id);
    setUser({ ...user, role: 'customer' });
    setPartnerProfile(null);
    router.push('/feed');
  };

  if (pageLoading) return <div className="min-h-screen bg-primary-light flex items-center justify-center"><Loader2 size={40} className="text-secondary animate-spin" /></div>;

  const Input = ({ label, name, placeholder, type }: { label: string; name: string; placeholder?: string; type?: string }) => (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">{label}</label>
      <input type={type || 'text'} value={form[name] || ''} onChange={e => update(name, e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm" />
    </div>
  );

  const CheckboxGrid = ({ items, stateKey }: { items: string[]; stateKey: string }) => (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => (
        <button key={item} type="button" onClick={() => toggleArray(stateKey, item)}
          className={`p-2.5 rounded-xl border text-xs text-left transition ${(form[stateKey] as string[]).includes(item) ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20 hover:bg-primary/10'}`}
        >{item}</button>
      ))}
    </div>
  );

  const categoryLabel = category === 'guide' ? 'ไกด์นำเที่ยว' : category === 'driver' ? 'คนขับรถ' : 'ล่าม / นักแปล';

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleSwitchToCustomer} className="flex items-center gap-1.5 text-sm text-tmuted hover:bg-white/50 transition px-3 py-2 rounded-xl"><ArrowLeft size={16} /> เปลี่ยนเป็นลูกค้า</button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-danger hover:bg-danger/5 transition px-3 py-2 rounded-xl"><LogOut size={16} /> ออกจากระบบ</button>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-tmain">ลงทะเบียน{categoryLabel}</h1>
          <p className="text-tmuted mt-1 text-sm">ขั้นตอนที่ {step} จาก {totalSteps}</p>
          <div className="flex gap-1.5 justify-center mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 w-10 rounded-full transition ${step > i ? 'bg-primary' : 'bg-primary-dark/20'}`} />
            ))}
          </div>
        </div>

        {error && <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">{error}</div>}

        <div className="bg-white rounded-3xl shadow-xl p-6 animate-fade-in">

          {step === 1 && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ข้อมูลส่วนบุคคล</h2>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div onClick={() => avatarRef.current?.click()} className="w-24 h-24 rounded-full bg-primary/10 border-3 border-primary flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={28} className="text-primary-text" />}
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  <p className="text-xs text-tmuted text-center mt-1">รูปโปรไฟล์</p>
                </div>
              </div>
              <div className="space-y-3">
                <Input label="ชื่อธุรกิจ / ชื่อบริการ" name="business_name" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ชื่อ-นามสกุล (ไทย)" name="full_name_th" />
                  <Input label="Name (English)" name="full_name_en" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="ชื่อเล่น" name="nickname" />
                  <Input label="อายุ" name="age" type="number" />
                  <Input label="สัญชาติ" name="nationality" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="เลขบัตรประชาชน" name="id_number" />
                  <Input label="วันเกิด" name="date_of_birth" type="date" />
                </div>
                {category === 'guide' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="เลขใบอนุญาตไกด์" name="guide_license_no" />
                    <Input label="ประเภทใบอนุญาต" name="guide_license_type" />
                  </div>
                )}
                {category === 'translator' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Passport No. (ถ้ามี)" name="passport_no" />
                    <Input label="ระดับการศึกษา" name="education_level" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="เบอร์โทรศัพท์" name="phone" />
                  <Input label="LINE ID" name="line_id" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="WeChat ID" name="wechat_id" />
                  <Input label="Email" name="contact_email" type="email" />
                </div>
                <Input label="ที่อยู่ปัจจุบัน" name="address" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="จังหวัด" name="province" />
                  <Input label="รหัสไปรษณีย์" name="postcode" />
                </div>
              </div>
            </>
          )}

          {step === 2 && category === 'driver' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ใบขับขี่และยานพาหนะ</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-tmain mb-2 block">ประเภทใบอนุญาตขับขี่</label>
                  <div className="flex gap-2">
                    {['ส่วนบุคคล (ตลอดชีพ/5ปี)', 'สาธารณะ (เล่มเหลือง)'].map(t => (
                      <button key={t} type="button" onClick={() => update('driving_license_type', t)} className={`flex-1 p-2.5 rounded-xl border text-xs transition ${form.driving_license_type === t ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="เลขที่ใบขับขี่" name="driving_license_no" />
                  <Input label="วันหมดอายุ" name="driving_license_expiry" type="date" />
                </div>
                <hr className="border-primary-dark/10 my-2" />
                <p className="text-sm font-semibold text-tmain">ข้อมูลรถ</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ยี่ห้อ / รุ่น" name="vehicle_brand" />
                  <Input label="สีรถ" name="vehicle_color" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="เลขทะเบียนรถ" name="vehicle_plate" />
                  <Input label="จังหวัด (ทะเบียน)" name="vehicle_plate_province" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ปีจดทะเบียน" name="vehicle_year" type="number" />
                  <Input label="จำนวนที่นั่ง" name="vehicle_seats" type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium text-tmain mb-2 block">ประเภทป้ายทะเบียน</label>
                  <div className="flex gap-2">
                    {['ป้ายเหลือง (สาธารณะ)', 'ป้ายขาว (ส่วนบุคคล)'].map(t => (
                      <button key={t} type="button" onClick={() => update('vehicle_plate_type', t)} className={`flex-1 p-2.5 rounded-xl border text-xs transition ${form.vehicle_plate_type === t ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-tmain mb-2 block">ประกันภัยภาคสมัครใจ</label>
                  <div className="flex gap-2 flex-wrap">
                    {['ชั้น 1', 'ชั้น 2+', 'ชั้น 3', 'ไม่มีประกัน'].map(t => (
                      <button key={t} type="button" onClick={() => update('vehicle_insurance_voluntary', t)} className={`px-3 py-2 rounded-xl border text-xs transition ${form.vehicle_insurance_voluntary === t ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && category === 'translator' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ความเชี่ยวชาญด้านการแปล</h2>
              <div className="space-y-3">
                <Input label="สาขาวิชา / Major" name="education_major" />
                <div>
                  <label className="text-sm font-medium text-tmain mb-2 block">หมวดงานที่เชี่ยวชาญ</label>
                  <CheckboxGrid items={TRANSLATOR_SPECS} stateKey="translation_specializations" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="จำนวนคำเฉลี่ยต่อวัน" name="daily_capacity" placeholder="เช่น 3000 คำ" />
                  <Input label="ราคาเริ่มต้น (ต่อคำ/หน้า)" name="rate_per_word" placeholder="เช่น 1.5 บาท/คำ" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="เวลาทำงานที่ถนัด" name="working_hours" placeholder="เช่น 9:00-18:00" />
                  <div>
                    <label className="text-sm font-medium text-tmain mb-1 block">รับงานด่วน?</label>
                    <button type="button" onClick={() => update('rush_job_available', !form.rush_job_available)} className={`w-full px-4 py-3 rounded-xl border text-sm transition ${form.rush_job_available ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/30'}`}>
                      {form.rush_job_available ? '✓ รับงานด่วน' : 'ไม่รับงานด่วน'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && category === 'guide' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ความสามารถด้านภาษา</h2>
              <div className="space-y-3">
                {LANG_LIST.map(lang => (
                  <div key={lang}>
                    <p className="text-sm font-medium text-tmain mb-1.5">{lang}</p>
                    <div className="flex gap-2">
                      {LANG_LEVELS.map(level => (
                        <button key={level} type="button" onClick={() => updateLang(lang, level)} className={`flex-1 py-2 rounded-lg border text-xs transition ${form.languages[lang] === level ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{level}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ภาษาอื่นๆ (ระบุ)" name="other_language" placeholder="เช่น ภาษาญี่ปุ่น" />
                  <div>
                    <label className="text-sm font-medium text-tmain mb-1 block">ระดับ</label>
                    <div className="flex gap-1">
                      {LANG_LEVELS.map(level => (
                        <button key={level} type="button" onClick={() => update('other_language_level', level)} className={`flex-1 py-2 rounded-lg border text-[10px] transition ${form.other_language_level === level ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{level}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (category === 'guide' || category === 'driver') && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">
                {category === 'guide' ? 'ทักษะและสไตล์นำเที่ยว' : 'สไตล์บริการและทักษะ'}
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-tmain mb-2">{category === 'guide' ? 'สไตล์การนำเที่ยว' : 'สไตล์การบริการ'}</p>
                  <CheckboxGrid items={category === 'guide' ? GUIDE_STYLES : DRIVER_STYLES} stateKey="service_styles" />
                </div>
                <div>
                  <p className="text-sm font-medium text-tmain mb-2">ทักษะพิเศษ</p>
                  <CheckboxGrid items={category === 'guide' ? GUIDE_SKILLS : DRIVER_SKILLS} stateKey="skills" />
                </div>
                <div>
                  <label className="text-sm font-medium text-tmain mb-1 block">{category === 'guide' ? 'เส้นทาง / Hidden Gem ที่เชี่ยวชาญ' : 'เส้นทางที่เชี่ยวชาญ'}</label>
                  <textarea value={form.special_routes} onChange={e => update('special_routes', e.target.value)} rows={3} placeholder="ระบุเส้นทางหรือสถานที่พิเศษ..." className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm resize-none" />
                </div>
              </div>
            </>
          )}

          {step === 3 && category === 'translator' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ภาษาและทักษะเสริม</h2>
              <div className="space-y-3">
                {LANG_LIST.map(lang => (
                  <div key={lang}>
                    <p className="text-sm font-medium text-tmain mb-1.5">{lang}</p>
                    <div className="flex gap-2">
                      {LANG_LEVELS.map(level => (
                        <button key={level} type="button" onClick={() => updateLang(lang, level)} className={`flex-1 py-2 rounded-lg border text-xs transition ${form.languages[lang] === level ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{level}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ภาษาอื่นๆ (ระบุ)" name="other_language" placeholder="เช่น ภาษาญี่ปุ่น" />
                  <div>
                    <label className="text-sm font-medium text-tmain mb-1 block">ระดับ</label>
                    <div className="flex gap-1">
                      {LANG_LEVELS.map(level => (
                        <button key={level} type="button" onClick={() => update('other_language_level', level)} className={`flex-1 py-2 rounded-lg border text-[10px] transition ${form.other_language_level === level ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{level}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <hr className="border-primary-dark/10" />
                <p className="text-sm font-semibold text-tmain">ทักษะพิเศษเพิ่มเติม</p>
                <CheckboxGrid items={TRANSLATOR_SKILLS} stateKey="skills" />
              </div>
            </>
          )}

          {((step === 4 && (category === 'guide' || category === 'driver')) || (step === 4 && category === 'translator')) && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ข้อมูลบัญชีธนาคาร</h2>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mb-4">⚠ ชื่อบัญชีต้องตรงกับชื่อผู้สมัครเท่านั้น</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ชื่อธนาคาร" name="bank_name" />
                  <Input label="สาขา" name="bank_branch" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ชื่อบัญชี" name="account_name" />
                  <Input label="เลขที่บัญชี" name="account_number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="ประเภทบัญชี" name="account_type" placeholder="ออมทรัพย์ / กระแสรายวัน" />
                  <Input label="PromptPay / พร้อมเพย์" name="promptpay" />
                </div>
                {category === 'driver' && (
                  <>
                    <hr className="border-primary-dark/10" />
                    <h2 className="font-bold text-lg text-tmain">ภาษา</h2>
                    {LANG_LIST.map(lang => (
                      <div key={lang}>
                        <p className="text-sm font-medium text-tmain mb-1.5">{lang}</p>
                        <div className="flex gap-2">
                          {LANG_LEVELS.map(level => (
                            <button key={level} type="button" onClick={() => updateLang(lang, level)} className={`flex-1 py-2 rounded-lg border text-xs transition ${form.languages[lang] === level ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{level}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {step === totalSteps && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">อัปโหลดผลงานและยืนยัน</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-tmain mb-1">คำอธิบาย / แนะนำตัว</p>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="เล่าเกี่ยวกับบริการของคุณ..." className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm resize-none" />
                </div>
                <div>
                  <p className="text-sm font-medium text-tmain mb-2">รูปภาพผลงาน / เอกสาร (อย่างน้อย 1 รูป)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {portfolioFiles.map((f, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-primary/20">
                        <img src={f.preview} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setPortfolioFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-primary-light"><X size={12} /></button>
                      </div>
                    ))}
                    {portfolioFiles.length < 10 && (
                      <button onClick={() => portfolioRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-primary-dark/40 flex flex-col items-center justify-center text-tmuted hover:border-primary hover:bg-primary/20 transition">
                        <ImagePlus size={20} /><span className="text-[10px] mt-1">เพิ่มรูป</span>
                      </button>
                    )}
                  </div>
                  <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={handlePortfolioSelect} className="hidden" />
                </div>
                <label className="flex items-start gap-3 bg-primary-light rounded-xl p-4 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => update('terms_accepted', e.target.checked)} className="mt-1 w-4 h-4 accent-primary" />
                  <span className="text-xs text-tmuted leading-relaxed">
                    ข้าพเจ้าขอรับรองว่าข้อมูลทั้งหมดถูกต้องและเป็นความจริง ข้าพเจ้าได้อ่านและยอมรับข้อกำหนดและเงื่อนไขการให้บริการบนแพลตฟอร์ม ChillGo Travel ทั้งหมดแล้ว
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 bg-primary/20 text-tmuted font-semibold py-3 rounded-2xl transition hover:bg-primary-dark/30">ย้อนกลับ</button>
            )}
            {step < totalSteps ? (
              <button onClick={() => { setError(''); setStep(s => s + 1); }} className="flex-1 bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2">
                ถัดไป <ArrowRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!form.terms_accepted || portfolioFiles.length === 0 || loading} className="flex-1 bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-40">
                {loading ? <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" /> : <><CheckCircle size={18} /> ส่งใบสมัคร</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
