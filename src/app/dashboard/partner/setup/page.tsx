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

const ACCOUNT_TYPES = ['ออมทรัพย์', 'กระแสรายวัน', 'ฝากประจำ'];

function FormInput({ label, name, placeholder, type, value, onChange, rows }: { label: string; name: string; placeholder?: string; type?: string; value: string; onChange: (name: string, val: string) => void; rows?: number }) {
  if (rows) {
    return (
      <div>
        <label className="text-sm font-medium text-tmain mb-1 block">{label}</label>
        <textarea value={value} onChange={e => onChange(name, e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm resize-none" />
      </div>
    );
  }
  return (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(name, e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm" />
    </div>
  );
}

function FormSelect({ label, name, options, value, onChange }: { label: string; name: string; options: string[]; value: string; onChange: (name: string, val: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(name, e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm bg-white">
        <option value="">เลือก...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CheckboxGrid({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (item: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => (
        <button key={item} type="button" onClick={() => onToggle(item)}
          className={`p-2.5 rounded-xl border text-xs text-left transition ${selected.includes(item) ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20 hover:bg-primary/10'}`}
        >{item}</button>
      ))}
    </div>
  );
}

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
    marital_status: '',
    languages: {} as Record<string, string>, other_languages: [] as any[],
    skills: [] as string[], service_styles: [] as string[], special_routes: '',
    bank_name: '', bank_branch: '', account_name: '', account_number: '', account_type: '', promptpay: '',
    guide_license_no: '', guide_license_type: '',
    education: [] as any[],
    certifications: [] as string[],
    cert_detail: '',
    work_experience: [] as any[],
    driving_license_type: '', driving_license_no: '', driving_license_expiry: '',
    vehicle_brand: '', vehicle_color: '', vehicle_plate: '', vehicle_plate_province: '', vehicle_year: '', vehicle_seats: '',
    vehicle_plate_type: '', vehicle_insurance_compulsory: '', vehicle_insurance_compulsory_expiry: '', vehicle_insurance_voluntary: '',
    passport_no: '', education_level: '', education_major: '',
    translation_specializations: [] as string[],
    translation_pairs: [] as any[],
    test_scores: [] as any[],
    daily_capacity: '', rate_per_word: '', working_hours: '', rush_job_available: false,
    terms_accepted: false,
  });

  const avatarRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);
  const { user, partnerProfile, setPartnerProfile, setUser } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const category = localPartnerProfile?.category || 'guide';
  const totalSteps = category === 'guide' ? 8 : category === 'driver' ? 5 : 5;

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
        updateData.education = form.education;
        updateData.certifications = form.certifications;
        updateData.work_experience = form.work_experience;
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
        updateData.translation_pairs = form.translation_pairs;
        updateData.test_scores = form.test_scores;
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
    if (localPartnerProfile && (!localPartnerProfile.portfolio_images || localPartnerProfile.portfolio_images.length === 0)) {
      await supabase.from('partner_profiles').delete().eq('id', localPartnerProfile.id);
    }
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', user.id);
    setUser({ ...user, role: 'customer' });
    setPartnerProfile(null);
    window.location.href = '/feed';
  };

  if (pageLoading) return <div className="min-h-screen bg-primary-light flex items-center justify-center"><Loader2 size={40} className="text-secondary animate-spin" /></div>;

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
              <h2 className="font-bold text-lg text-tmain mb-4">{category === 'translator' ? 'ข้อมูลส่วนบุคคล / Personal Information' : 'ข้อมูลส่วนบุคคล'}</h2>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div onClick={() => avatarRef.current?.click()} className="w-24 h-24 rounded-full bg-primary/10 border-3 border-primary flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={28} className="text-primary-text" />}
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  <p className="text-xs text-tmuted text-center mt-1">{category === 'translator' ? 'รูปโปรไฟล์ / Profile Photo' : 'รูปโปรไฟล์'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <FormInput label={category === 'translator' ? 'ชื่อธุรกิจ / Business Name' : 'ชื่อธุรกิจ / ชื่อบริการ'} name="business_name" value={form["business_name"] || ''} onChange={update} />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="ชื่อ-นามสกุล (ไทย)" name="full_name_th" value={form["full_name_th"] || ''} onChange={update} />
                  <FormInput label="Name-Surname (English)" name="full_name_en" value={form["full_name_en"] || ''} onChange={update} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label={category === 'translator' ? 'ชื่อเล่น / Nickname' : 'ชื่อเล่น'} name="nickname" value={form["nickname"] || ''} onChange={update} />
                  <FormInput label={category === 'translator' ? 'อายุ / Age' : 'อายุ'} name="age" type="number" value={form["age"] || ''} onChange={update} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label={category === 'translator' ? 'เลขบัตรประชาชน / ID No.' : 'เลขบัตรประชาชน'} name="id_number" value={form["id_number"] || ''} onChange={update} />
                  <FormInput label={category === 'translator' ? 'วันเกิด / Date of Birth' : 'วันเกิด'} name="date_of_birth" type="date" value={form["date_of_birth"] || ''} onChange={update} />
                </div>
                {category === 'guide' && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="เลขใบอนุญาตไกด์" name="guide_license_no" value={form["guide_license_no"] || ''} onChange={update} />
                    <FormInput label="ประเภทใบอนุญาต" name="guide_license_type" value={form["guide_license_type"] || ''} onChange={update} />
                  </div>
                )}
                {category === 'guide' && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="สัญชาติ / Nationality" name="nationality" value={form["nationality"] || ''} onChange={update} />
                    <FormInput label="สถานภาพ / Status" name="marital_status" value={form["marital_status"] || ''} onChange={update} />
                  </div>
                )}
                {category === 'translator' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput label="Passport No. / หนังสือเดินทาง (ถ้ามี)" name="passport_no" value={form["passport_no"] || ''} onChange={update} />
                      <FormInput label="ระดับการศึกษา / Education" name="education_level" value={form["education_level"] || ''} onChange={update} />
                    </div>
                    <FormInput label="สาขาวิชา / Major" name="education_major" value={form["education_major"] || ''} onChange={update} />
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label={category === 'translator' ? 'เบอร์โทรศัพท์ / Phone' : 'เบอร์โทรศัพท์'} name="phone" value={form["phone"] || ''} onChange={update} />
                  <FormInput label="LINE ID" name="line_id" value={form["line_id"] || ''} onChange={update} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="WeChat ID" name="wechat_id" value={form["wechat_id"] || ''} onChange={update} />
                  <FormInput label="Email" name="contact_email" type="email" value={form["contact_email"] || ''} onChange={update} />
                </div>
                <FormInput label={category === 'translator' ? 'ที่อยู่ปัจจุบัน / Current Address' : 'ที่อยู่ปัจจุบัน'} name="address" rows={3} value={form["address"] || ''} onChange={update} />
                {category === 'guide' && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="จังหวัด / Province" name="province" value={form["province"] || ''} onChange={update} />
                    <FormInput label="รหัสไปรษณีย์ / Postcode" name="postcode" value={form["postcode"] || ''} onChange={update} />
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && category === 'driver' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-3">ใบขับขี่และยานพาหนะ</h2>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-red-700 mb-1">⚠ คำแจ้งเตือนสำคัญ / Important Legal Notice</p>
                <p className="text-xs text-red-600 leading-relaxed">พาร์ทเนอร์มีหน้าที่ตรวจสอบและรับรองว่าใบอนุญาตขับขี่และประเภทรถของตนเป็นไปตามที่กฎหมายกำหนดสำหรับการให้บริการรับจ้างขนส่งผู้โดยสาร บริษัทในฐานะแพลตฟอร์มตัวกลางจะไม่รับผิดชอบต่อค่าปรับ การถูกดำเนินคดี หรือความเสียหายใดๆ อันเกิดจากการใช้รถหรือใบขับขี่ผิดประเภท</p>
              </div>
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
                  <FormInput label="เลขที่ใบขับขี่" name="driving_license_no" value={form["driving_license_no"] || ''} onChange={update} />
                  <FormInput label="วันหมดอายุ" name="driving_license_expiry" type="date" value={form["driving_license_expiry"] || ''} onChange={update} />
                </div>
                <hr className="border-primary-dark/10 my-2" />
                <p className="text-sm font-semibold text-tmain">ข้อมูลรถ</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="ยี่ห้อ / รุ่น" name="vehicle_brand" value={form["vehicle_brand"] || ''} onChange={update} />
                  <FormInput label="สีรถ" name="vehicle_color" value={form["vehicle_color"] || ''} onChange={update} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="เลขทะเบียนรถ" name="vehicle_plate" value={form["vehicle_plate"] || ''} onChange={update} />
                  <FormInput label="จังหวัด (ทะเบียน)" name="vehicle_plate_province" value={form["vehicle_plate_province"] || ''} onChange={update} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="ปีจดทะเบียน" name="vehicle_year" type="number" value={form["vehicle_year"] || ''} onChange={update} />
                  <FormInput label="จำนวนที่นั่ง" name="vehicle_seats" type="number" value={form["vehicle_seats"] || ''} onChange={update} />
                </div>
                <div>
                  <label className="text-sm font-medium text-tmain mb-2 block">ประเภทป้ายทะเบียน</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'ป้ายเหลือง (สาธารณะ)', note: 'ถูกกฎหมายรับจ้าง' },
                      { value: 'ป้ายขาว (ส่วนบุคคล)', note: 'รับความเสี่ยงเอง' },
                    ].map(t => (
                      <button key={t.value} type="button" onClick={() => update('vehicle_plate_type', t.value)} className={`flex-1 p-2.5 rounded-xl border text-xs transition text-center ${form.vehicle_plate_type === t.value ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>
                        {t.value}<br/><span className="text-[10px] text-tmuted">— {t.note}</span>
                      </button>
                    ))}
                  </div>
                  {form.vehicle_plate_type === 'ป้ายขาว (ส่วนบุคคล)' && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mt-2">📌 พาร์ทเนอร์ที่ใช้ "ป้ายขาว" ยังสามารถสมัครและรับงานได้ โดยถือเป็นการรับทราบและยอมรับความเสี่ยงทางกฎหมายด้วยตนเอง</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="สถานะ พ.ร.บ." name="vehicle_insurance_compulsory" placeholder="เช่น มี / อยู่ระหว่างต่อ" value={form["vehicle_insurance_compulsory"] || ''} onChange={update} />
                  <FormInput label="วันสิ้นสุด พ.ร.บ." name="vehicle_insurance_compulsory_expiry" type="date" value={form["vehicle_insurance_compulsory_expiry"] || ''} onChange={update} />
                </div>
              </div>
            </>
          )}

          {step === 2 && category === 'translator' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">คู่ภาษาและใบรับรอง / Language Pairs & Certifications</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-tmain">คู่ภาษาที่แปลได้ / Translation Language Pairs</p>
                    <button type="button" onClick={() => update('translation_pairs', [...form.translation_pairs, { source: '', target: '', level: '', mode: 'ทั้งคู่', experience: '' }])} className="text-xs bg-primary/20 hover:bg-primary/30 text-tmain px-3 py-1.5 rounded-lg transition font-medium">+ เพิ่มคู่ภาษา</button>
                  </div>
                  {form.translation_pairs.length === 0 && (
                    <p className="text-xs text-tmuted bg-primary-light rounded-xl p-3 text-center">กด "เพิ่มคู่ภาษา" เพื่อเริ่มเพิ่มข้อมูล</p>
                  )}
                  {form.translation_pairs.map((pair: any, i: number) => (
                    <div key={i} className="bg-primary-light rounded-xl p-3 mb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-tmuted">คู่ที่ {i + 1}</span>
                        <button type="button" onClick={() => update('translation_pairs', form.translation_pairs.filter((_: any, idx: number) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">ลบ</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="ภาษาต้นทาง / Source" value={pair.source} onChange={e => { const arr = [...form.translation_pairs]; arr[i] = { ...arr[i], source: e.target.value }; update('translation_pairs', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                        <input placeholder="ภาษาปลายทาง / Target" value={pair.target} onChange={e => { const arr = [...form.translation_pairs]; arr[i] = { ...arr[i], target: e.target.value }; update('translation_pairs', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select value={pair.level} onChange={e => { const arr = [...form.translation_pairs]; arr[i] = { ...arr[i], level: e.target.value }; update('translation_pairs', arr); }} className="px-2 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none bg-white">
                          <option value="">ระดับ / Level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                        <select value={pair.mode} onChange={e => { const arr = [...form.translation_pairs]; arr[i] = { ...arr[i], mode: e.target.value }; update('translation_pairs', arr); }} className="px-2 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none bg-white">
                          <option value="แปล">แปล / Translate</option>
                          <option value="ตรวจแก้">ตรวจแก้ / Proofread</option>
                          <option value="ทั้งคู่">ทั้งคู่ / Both</option>
                        </select>
                        <input placeholder="ประสบการณ์ (ปี)" value={pair.experience} onChange={e => { const arr = [...form.translation_pairs]; arr[i] = { ...arr[i], experience: e.target.value }; update('translation_pairs', arr); }} className="px-2 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="border-primary-dark/10" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-tmain">คะแนนสอบวัดระดับ / Test Scores & Certifications</p>
                    <button type="button" onClick={() => update('test_scores', [...form.test_scores, { test_name: '', score: '', institution: '', year: '', expiry: '' }])} className="text-xs bg-primary/20 hover:bg-primary/30 text-tmain px-3 py-1.5 rounded-lg transition font-medium">+ เพิ่มใบรับรอง</button>
                  </div>
                  {form.test_scores.length === 0 && (
                    <p className="text-xs text-tmuted bg-primary-light rounded-xl p-3 text-center">กด "เพิ่มใบรับรอง" เพื่อเริ่มเพิ่มข้อมูล</p>
                  )}
                  {form.test_scores.map((ts: any, i: number) => (
                    <div key={i} className="bg-primary-light rounded-xl p-3 mb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-tmuted">ใบรับรองที่ {i + 1}</span>
                        <button type="button" onClick={() => update('test_scores', form.test_scores.filter((_: any, idx: number) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">ลบ</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="ชื่อข้อสอบ / Test Name" value={ts.test_name} onChange={e => { const arr = [...form.test_scores]; arr[i] = { ...arr[i], test_name: e.target.value }; update('test_scores', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                        <input placeholder="คะแนน / Score" value={ts.score} onChange={e => { const arr = [...form.test_scores]; arr[i] = { ...arr[i], score: e.target.value }; update('test_scores', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input placeholder="สถาบัน / Institution" value={ts.institution} onChange={e => { const arr = [...form.test_scores]; arr[i] = { ...arr[i], institution: e.target.value }; update('test_scores', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                        <input placeholder="ปีที่สอบ / Year" value={ts.year} onChange={e => { const arr = [...form.test_scores]; arr[i] = { ...arr[i], year: e.target.value }; update('test_scores', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                        <input type="date" placeholder="หมดอายุ" value={ts.expiry} onChange={e => { const arr = [...form.test_scores]; arr[i] = { ...arr[i], expiry: e.target.value }; update('test_scores', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                      </div>
                    </div>
                  ))}
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
                <hr className="border-primary-dark/10" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-tmain">ภาษาอื่น ๆ / Other Languages</p>
                  <button type="button" onClick={() => update('other_languages', [...form.other_languages, { name: '', level: '' }])} className="text-xs bg-primary/20 hover:bg-primary/30 text-tmain px-3 py-1.5 rounded-lg transition font-medium">+ เพิ่มภาษา</button>
                </div>
                {form.other_languages.map((ol: any, i: number) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <input placeholder="ชื่อภาษา เช่น ภาษาญี่ปุ่น" value={ol.name} onChange={e => { const arr = [...form.other_languages]; arr[i] = { ...arr[i], name: e.target.value }; update('other_languages', arr); }} className="w-full px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                    </div>
                    <div className="flex gap-1">
                      {LANG_LEVELS.map(level => (
                        <button key={level} type="button" onClick={() => { const arr = [...form.other_languages]; arr[i] = { ...arr[i], level }; update('other_languages', arr); }} className={`px-2 py-2 rounded-lg border text-[10px] transition ${ol.level === level ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20'}`}>{level}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => update('other_languages', form.other_languages.filter((_: any, idx: number) => idx !== i))} className="text-xs text-red-500 hover:text-red-700 py-2">ลบ</button>
                  </div>
                ))}
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
                  <CheckboxGrid items={category === 'guide' ? GUIDE_STYLES : DRIVER_STYLES} selected={form["service_styles"] as string[]} onToggle={(item) => toggleArray("service_styles", item)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-tmain mb-2">ทักษะพิเศษ</p>
                  <CheckboxGrid items={category === 'guide' ? GUIDE_SKILLS : DRIVER_SKILLS} selected={form["skills"] as string[]} onToggle={(item) => toggleArray("skills", item)} />
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
              <h2 className="font-bold text-lg text-tmain mb-4">หมวดงานและทักษะ / Specialization & Skills</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-tmain mb-2">หมวดงานที่เชี่ยวชาญ / Translation Specialization</p>
                  <CheckboxGrid items={TRANSLATOR_SPECS} selected={form["translation_specializations"] as string[]} onToggle={(item) => toggleArray("translation_specializations", item)} />
                </div>
                <hr className="border-primary-dark/10" />
                <div>
                  <p className="text-sm font-semibold text-tmain mb-2">ทักษะพิเศษเพิ่มเติม / Extra Skills</p>
                  <CheckboxGrid items={TRANSLATOR_SKILLS} selected={form["skills"] as string[]} onToggle={(item) => toggleArray("skills", item)} />
                </div>
              </div>
            </>
          )}

          {step === 4 && category === 'guide' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ประวัติการศึกษาและใบอนุญาต</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-tmain">ระดับการศึกษา</p>
                    <button type="button" onClick={() => update('education', [...form.education, { level: '', institution: '', major: '', year: '' }])} className="text-xs bg-primary/20 hover:bg-primary/30 text-tmain px-3 py-1.5 rounded-lg transition font-medium">+ เพิ่ม</button>
                  </div>
                  {form.education.length === 0 && <p className="text-xs text-tmuted bg-primary-light rounded-xl p-3 text-center">กด + เพิ่ม เพื่อเพิ่มข้อมูลการศึกษา</p>}
                  {form.education.map((edu: any, i: number) => (
                    <div key={i} className="bg-primary-light rounded-xl p-3 mb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-tmuted">ลำดับที่ {i + 1}</span>
                        <button type="button" onClick={() => update('education', form.education.filter((_: any, idx: number) => idx !== i))} className="text-xs text-red-500">ลบ</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={edu.level} onChange={e => { const arr = [...form.education]; arr[i] = { ...arr[i], level: e.target.value }; update('education', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none bg-white">
                          <option value="">ระดับการศึกษา</option>
                          <option value="มัธยม / Secondary">มัธยม / Secondary</option>
                          <option value="อนุปริญญา / Diploma">อนุปริญญา / Diploma</option>
                          <option value="ปริญญาตรี / Bachelor">ปริญญาตรี / Bachelor</option>
                          <option value="สูงกว่าปริญญาตรี / Graduate">สูงกว่าปริญญาตรี / Graduate</option>
                        </select>
                        <input placeholder="ชื่อสถาบัน / Institution" value={edu.institution} onChange={e => { const arr = [...form.education]; arr[i] = { ...arr[i], institution: e.target.value }; update('education', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="สาขาวิชา / Major" value={edu.major} onChange={e => { const arr = [...form.education]; arr[i] = { ...arr[i], major: e.target.value }; update('education', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none" />
                        <input placeholder="ปีที่จบ / Year" value={edu.year} onChange={e => { const arr = [...form.education]; arr[i] = { ...arr[i], year: e.target.value }; update('education', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
                <hr className="border-primary-dark/10" />
                <p className="text-sm font-semibold text-tmain">ใบอนุญาตและใบรับรอง (Licenses & Certifications)</p>
                <div className="grid grid-cols-2 gap-2">
                  {['ใบอนุญาตมัคคุเทศก์ (Thai Guide)', 'CPR / First Aid Certificate', 'Chinese Proficiency (HSK / อื่นๆ)', 'English (IELTS / TOEIC / อื่นๆ)'].map(cert => (
                    <button key={cert} type="button" onClick={() => toggleArray('certifications', cert)} className={`p-2 rounded-xl border text-xs text-left transition ${(form.certifications as string[]).includes(cert) ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20 hover:bg-primary/10'}`}>{cert}</button>
                  ))}
                </div>
                <FormInput label="ระบุชื่อใบรับรองและระดับ / Certificate name & level" name="cert_detail" rows={2} value={form["cert_detail"] || ''} onChange={update} />
              </div>
            </>
          )}

          {step === 5 && category === 'guide' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ประสบการณ์ทำงาน / Work Experience</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-tmain">ประวัติการทำงาน</p>
                  <button type="button" onClick={() => update('work_experience', [...form.work_experience, { company: '', position: '', period: '', reason_left: '' }])} className="text-xs bg-primary/20 hover:bg-primary/30 text-tmain px-3 py-1.5 rounded-lg transition font-medium">+ เพิ่ม</button>
                </div>
                {form.work_experience.length === 0 && <p className="text-xs text-tmuted bg-primary-light rounded-xl p-3 text-center">กด + เพิ่ม เพื่อเพิ่มประสบการณ์ทำงาน</p>}
                {form.work_experience.map((we: any, i: number) => (
                  <div key={i} className="bg-primary-light rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-tmuted">ลำดับที่ {i + 1}</span>
                      <button type="button" onClick={() => update('work_experience', form.work_experience.filter((_: any, idx: number) => idx !== i))} className="text-xs text-red-500">ลบ</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="บริษัท / Company" value={we.company} onChange={e => { const arr = [...form.work_experience]; arr[i] = { ...arr[i], company: e.target.value }; update('work_experience', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none" />
                      <input placeholder="ตำแหน่ง / Position" value={we.position} onChange={e => { const arr = [...form.work_experience]; arr[i] = { ...arr[i], position: e.target.value }; update('work_experience', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="ระยะเวลา / Period" value={we.period} onChange={e => { const arr = [...form.work_experience]; arr[i] = { ...arr[i], period: e.target.value }; update('work_experience', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none" />
                      <input placeholder="สาเหตุที่ออก / Reason Left" value={we.reason_left} onChange={e => { const arr = [...form.work_experience]; arr[i] = { ...arr[i], reason_left: e.target.value }; update('work_experience', arr); }} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {((step === 6 && category === 'guide') || (step === 4 && (category === 'driver' || category === 'translator'))) && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">{category === 'translator' ? 'ข้อมูลบัญชีธนาคาร / Bank Account Information' : 'ข้อมูลบัญชีธนาคาร'}</h2>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mb-4">{category === 'translator' ? '⚠ ชื่อบัญชีต้องตรงกับชื่อผู้สมัครเท่านั้น / Account name must match applicant\'s name' : '⚠ ชื่อบัญชีต้องตรงกับชื่อผู้สมัครเท่านั้น'}</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label={category === 'translator' ? 'ชื่อธนาคาร / Bank Name' : 'ชื่อธนาคาร'} name="bank_name" value={form["bank_name"] || ''} onChange={update} />
                  <FormInput label={category === 'translator' ? 'สาขา / Branch' : 'สาขา'} name="bank_branch" value={form["bank_branch"] || ''} onChange={update} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label={category === 'translator' ? 'ชื่อบัญชี / Account Name' : 'ชื่อบัญชี'} name="account_name" value={form["account_name"] || ''} onChange={update} />
                  <FormInput label={category === 'translator' ? 'เลขที่บัญชี / Account No.' : 'เลขที่บัญชี'} name="account_number" value={form["account_number"] || ''} onChange={update} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormSelect label={category === 'translator' ? 'ประเภทบัญชี / Account Type' : 'ประเภทบัญชี'} name="account_type" options={ACCOUNT_TYPES} value={form["account_type"] || ''} onChange={update} />
                  <FormInput label="PromptPay / พร้อมเพย์" name="promptpay" value={form["promptpay"] || ''} onChange={update} />
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

          {step === 7 && category === 'guide' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">อัปโหลดเอกสารและผลงาน</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-tmain mb-1">คำอธิบาย / แนะนำตัว</p>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="เล่าเกี่ยวกับบริการของคุณ..." className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary-light rounded-xl p-3">
                    <p className="text-xs font-semibold text-tmain mb-2">เอกสาร (Required Documents)</p>
                    <div className="space-y-1.5 text-xs text-tmuted">
                      <p>✓ สำเนาบัตรประชาชน</p>
                      <p>✓ สำเนาใบอนุญาตมัคคุเทศก์</p>
                      <p>✓ สำเนาหน้าสมุดบัญชีธนาคาร</p>
                      <p>✓ ทะเบียนบ้าน (ถ้ามี)</p>
                      <p>✓ ใบรับรองอื่น ๆ ที่เกี่ยวข้อง</p>
                    </div>
                  </div>
                  <div className="bg-primary-light rounded-xl p-3">
                    <p className="text-xs font-semibold text-tmain mb-2">สื่อและมีเดีย (Media)</p>
                    <div className="space-y-1.5 text-xs text-tmuted">
                      <p>✓ รูปถ่ายหน้าตรงชัดเจน (1:1)</p>
                      <p>✓ รูปถ่ายไลฟ์สไตล์ขณะทำงาน (3-5 รูป)</p>
                      <p>✓ วิดีโอแนะนำตัว (Intro Video) 1-2 นาที</p>
                      <p>✓ วิดีโอโชว์ทักษะการเอ็นเตอร์เทน</p>
                      <p>✓ Portfolio / ผลงานนำเที่ยวที่ผ่านมา</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-tmain mb-2">อัปโหลดรูปภาพ / เอกสาร (อย่างน้อย 1 ไฟล์)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {portfolioFiles.map((f, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-primary/20">
                        <img src={f.preview} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setPortfolioFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-primary-light"><X size={12} /></button>
                      </div>
                    ))}
                    {portfolioFiles.length < 10 && (
                      <button onClick={() => portfolioRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-primary-dark/40 flex flex-col items-center justify-center text-tmuted hover:border-primary hover:bg-primary/20 transition">
                        <ImagePlus size={20} /><span className="text-[10px] mt-1">เพิ่มไฟล์</span>
                      </button>
                    )}
                  </div>
                  <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={handlePortfolioSelect} className="hidden" />
                </div>
              </div>
            </>
          )}

          {step === 8 && category === 'guide' && (
            <>
              <h2 className="font-bold text-lg text-tmain mb-4">ข้อกำหนดและเงื่อนไข</h2>
              <div className="space-y-4">
                <div className="bg-primary-light rounded-xl p-4 max-h-64 overflow-y-auto text-xs text-tmuted leading-relaxed space-y-3">
                  <p className="font-semibold text-tmain">บริษัท ชิลโก ทราเวล จำกัด (Chill Go Travel Co., Ltd.) ขอชี้แจงสถานะและรูปแบบการดำเนินงานเพื่อความเข้าใจที่ตรงกันระหว่างบริษัทและพาร์ทเนอร์ผู้ร่วมงานทุกท่าน โดยมีรายละเอียดและเงื่อนไขดังต่อไปนี้</p>
                  <p><span className="font-semibold text-tmain">1. สถานะทางกฎหมายของบริษัท (Legal Status)</span><br/>บริษัท ชิลโก ทราเวล จำกัด เป็นเพียงผู้ให้บริการ "แพลตฟอร์มอิเล็กทรอนิกส์" (Platform Provider) ซึ่งทำหน้าที่เป็นตัวกลางในการเชื่อมโยงและอำนวยความสะดวกให้พาร์ทเนอร์ (เช่น ไกด์นำเที่ยว) และลูกค้าได้มาพบกันเท่านั้น บริษัทบริหารจัดการระบบการรับชำระเงิน การจัดการด้านความปลอดภัย และเทคโนโลยีเพื่อความสะดวกในการปฏิบัติงาน</p>
                  <p><span className="font-semibold text-tmain">2. ความสัมพันธ์ระหว่างคู่สัญญา (Legal Relationship)</span><br/>บริษัท ชิลโก ทราเวล จำกัด มิใช่ผู้ว่าจ้างหรือนายจ้าง และพาร์ทเนอร์มิใช่ลูกจ้างหรือพนักงานของบริษัท คู่สัญญาทั้งสองฝ่ายไม่มีนิติสัมพันธ์ในลักษณะการจ้างแรงงาน พาร์ทเนอร์จึงไม่มีสิทธิในสวัสดิการพนักงาน หรือการสมทบกองทุนประกันสังคมในฐานะลูกจ้าง (มาตรา 33) พาร์ทเนอร์เป็นผู้ดำเนินธุรกิจอิสระ (Freelancer / Independent Contractor)</p>
                  <p><span className="font-semibold text-tmain">3. อิสระในการกำหนดราคา (Pricing Freedom)</span><br/>พาร์ทเนอร์เป็นผู้มีอำนาจอิสระในการกำหนดราคาค่าบริการด้วยตนเอง โดยบริษัทจะทำหน้าที่เพียงสนับสนุนระบบการทำธุรกรรมให้เป็นไปอย่างโปร่งใสเท่านั้น</p>
                  <p><span className="font-semibold text-tmain">4. ความรับผิดชอบทางกฎหมายและการปฏิบัติงาน (Legal & Operational Responsibility)</span><br/>พาร์ทเนอร์มีหน้าที่ตรวจสอบและปฏิบัติตามกฎหมายและระเบียบข้อบังคับของราชการที่เกี่ยวข้องอย่างเคร่งครัด บริษัทขอสงวนสิทธิ์ที่จะไม่รับผิดชอบต่อความเสียหายหรือค่าปรับใดๆ ทั้งสิ้น</p>
                  <p><span className="font-semibold text-tmain">5. การหักค่าธรรมเนียมและการชำระเงิน (Fees & Payment)</span><br/>– ค่าบริการแพลตฟอร์ม: 15% ของรายได้<br/>– ภาษี: หักภาษี ณ ที่จ่าย ตามที่กฎหมายกำหนด<br/>– รอบการโอนเงิน: ภายใน 3 วันทำการหลังจากงานเสร็จสิ้น (ไม่นับวันหยุดราชการไทยและจีน)</p>
                  <p><span className="font-semibold text-tmain">6. กรณีความขัดแย้งระหว่างพาร์ทเนอร์และลูกค้า (Dispute Resolution)</span><br/>บริษัทจะไม่มีส่วนรับผิดชอบต่อความขัดแย้งส่วนบุคคลระหว่างพาร์ทเนอร์และลูกค้าในทุกกรณี เว้นแต่พาร์ทเนอร์ถูกประทุษร้ายและสามารถพิสูจน์ข้อเท็จจริงตามขั้นตอนทางกฎหมายได้ บริษัทจะพิจารณาจ่ายค่าเสียหายตามที่กฎหมายกำหนดเท่านั้น</p>
                </div>
                <label className="flex items-start gap-3 bg-white border border-primary-dark/20 rounded-xl p-4 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => update('terms_accepted', e.target.checked)} className="mt-1 w-4 h-4 accent-primary" />
                  <span className="text-xs text-tmuted leading-relaxed">
                    ข้าพเจ้าขอรับรองว่าข้อมูลทั้งหมดที่กรอกในใบสมัครนี้ถูกต้องและเป็นความจริงทุกประการ ข้าพเจ้าได้อ่านและทำความเข้าใจข้อกำหนดและเงื่อนไขการให้บริการบนแพลตฟอร์มครบถ้วนทุกข้อแล้ว และยอมรับเงื่อนไขทั้งหมดโดยไม่มีข้อโต้แย้ง
                  </span>
                </label>
              </div>
            </>
          )}

          {step === totalSteps && category !== 'guide' && (
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
                {loading ? <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" /> : <><CheckCircle size={18} /> ลงทะเบียน</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
