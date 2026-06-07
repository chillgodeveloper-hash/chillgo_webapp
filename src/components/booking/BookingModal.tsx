'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { checkContentViolation } from '@/lib/moderation';
import { X, Calendar, Users, Send, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Post } from '@/types';
import FlatpickrInput from '@/components/ui/FlatpickrInput';

interface BookingModalProps {
  post: Post;
  onClose: () => void;
}

const FITNESS_LEVELS = ['🚶 เดินได้น้อย', '🚶‍♂️ ปานกลาง', '🏃 เดินได้มาก', '💪 พร้อมทุกกิจกรรม'];
const BUDGETS = ['< 500 บ.', '500–1,000 บ.', '1,000–2,000 บ.', '2,000 บ. ขึ้นไป'];
const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'ไม่ทราบ'];

interface GroupMember {
  name: string;
  age: string;
  note: string;
}

function Section({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="border-b border-primary-dark/10 pb-2">
        <h3 className="font-bold text-tmain text-sm flex items-center gap-1.5">{icon} {title}</h3>
        {sub && <p className="text-xs text-tmuted mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type, optional, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; optional?: boolean; rows?: number }) {
  return (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">
        {label}{optional && <span className="text-tmuted font-normal"> (ไม่บังคับ)</span>}
      </label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm" />
      ) : (
        <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
      )}
    </div>
  );
}

function ChoiceRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(value === o ? '' : o)}
          className={`px-3 py-2 rounded-xl border text-xs transition ${value === o ? 'border-primary bg-primary/20 font-medium' : 'border-primary-dark/20 hover:bg-primary/10'}`}
        >{o}</button>
      ))}
    </div>
  );
}

export default function BookingModal({ post, onClose }: BookingModalProps) {
  const { user } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();
  const todayStr = new Date().toISOString().split('T')[0];

  // Booking essentials
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);

  // Section 1 — Traveler info
  const [travelerName, setTravelerName] = useState(user?.full_name || '');
  const [travelerAge, setTravelerAge] = useState('');
  const [contactChannel, setContactChannel] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyChannel, setEmergencyChannel] = useState('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Section 2 — Preferences
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');
  const [likes, setLikes] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [specialExpectations, setSpecialExpectations] = useState('');

  // Section 3 — Health & safety
  const [bloodType, setBloodType] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [regularMedication, setRegularMedication] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');

  // Section 4 — Consent
  const [consentData, setConsentData] = useState(false);
  const [consentHealth, setConsentHealth] = useState(false);
  const [consentTruth, setConsentTruth] = useState(false);
  const [signature, setSignature] = useState('');

  const [violation, setViolation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addMember = () => setGroupMembers((m) => [...m, { name: '', age: '', note: '' }]);
  const removeMember = (i: number) => setGroupMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, key: keyof GroupMember, val: string) =>
    setGroupMembers((m) => m.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Moderation on free-text fields
    const freeText = [likes, dislikes, lifestyle, specialExpectations, medicalConditions, foodAllergies].join(' ');
    if (freeText.trim()) {
      const check = checkContentViolation(freeText);
      if (check.isViolation) {
        setViolation(check.reason || '');
        return;
      }
    }

    if (!consentData || !consentTruth) {
      setError('กรุณายอมรับเงื่อนไขการเก็บข้อมูลและยืนยันความถูกต้องของข้อมูล');
      return;
    }

    setLoading(true);

    let partnerId = post.partner_profile?.user_id;
    if (!partnerId && post.partner_id) {
      const { data: pp } = await supabase.from('partner_profiles').select('user_id').eq('id', post.partner_id).single();
      partnerId = pp?.user_id;
    }
    if (!partnerId) {
      setError('ไม่พบข้อมูลพาร์ทเนอร์');
      setLoading(false);
      return;
    }

    const totalPrice = (post.price_min || 0) * (guests || 1);
    const cleanMembers = groupMembers.filter((m) => m.name.trim());

    const bookingData = {
      customer_id: user.id,
      partner_id: partnerId,
      post_id: post.id,
      booking_date: date,
      booking_end_date: endDate || null,
      guests,
      status: 'pending',
      total_price: totalPrice,
      note: specialExpectations || null,
      // Section 1
      traveler_name: travelerName || null,
      traveler_age: travelerAge ? parseInt(travelerAge) : null,
      contact_channel: contactChannel || null,
      emergency_contact: emergencyContact || null,
      emergency_channel: emergencyChannel || null,
      group_members: cleanMembers,
      // Section 2
      fitness_level: fitnessLevel || null,
      daily_budget: dailyBudget || null,
      likes: likes || null,
      dislikes: dislikes || null,
      lifestyle: lifestyle || null,
      special_expectations: specialExpectations || null,
      // Section 3
      blood_type: bloodType || null,
      medical_conditions: medicalConditions || null,
      regular_medication: regularMedication || null,
      food_allergies: foodAllergies || null,
      // Section 4
      consent_data: consentData,
      consent_health: consentHealth,
      consent_truth: consentTruth,
      traveler_signature: signature || null,
      signed_date: todayStr,
    };

    const { data, error: insErr } = await supabase.from('bookings').insert(bookingData).select().single();

    if (insErr) {
      console.error('Booking error:', insErr);
      setError(`การจองไม่สำเร็จ: ${insErr.message}`);
      setLoading(false);
      return;
    }

    if (data) {
      const notifications: any[] = [
        { user_id: user.id, title: 'ส่งคำขอจองแล้ว', message: `คำขอจอง "${post.title}" ถูกส่งแล้ว กรุณารอ Admin อนุมัติ`, type: 'booking', link: '/booking' },
        { user_id: partnerId, title: 'มีคำขอจองใหม่', message: `${user.full_name} ต้องการจอง "${post.title}"`, type: 'booking', link: '/booking' },
      ];
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
      if (admins) {
        admins.forEach((admin: any) => {
          notifications.push({ user_id: admin.id, title: 'คำขอจองใหม่รออนุมัติ', message: `${user.full_name} จอง "${post.title}" กรุณาตรวจสอบ`, type: 'booking', link: '/dashboard/admin/bookings' });
        });
      }
      const filtered = notifications.filter((n) => !!n.user_id);
      if (filtered.length > 0) await supabase.from('notifications').insert(filtered);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push('/booking');
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-3xl max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-primary-dark/15 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-lg text-tmain">แบบฟอร์มจองและออกแบบทริป</h2>
            <p className="text-xs text-tmuted">Booking & Customization</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary-dark/30 transition">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-tmain mb-2">ส่งคำขอจองสำเร็จ!</h3>
            <p className="text-tmuted text-sm">กรุณารอ Admin ตรวจสอบและอนุมัติ</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-primary-light rounded-2xl p-4">
              <p className="font-semibold text-tmain">{post.title}</p>
              <p className="text-sm text-tmuted">{post.partner_profile?.business_name}</p>
              {post.price_min && <p className="text-secondary font-bold mt-1">฿{post.price_min.toLocaleString()}</p>}
            </div>

            <p className="text-xs text-tmuted bg-info/5 border border-info/15 rounded-xl p-3">
              เพื่อให้ทริปของคุณเป็นประสบการณ์ที่พิเศษที่สุด เราขอสอบถามข้อมูลเล็กน้อยเพื่อออกแบบโปรแกรมที่ตรงกับไลฟ์สไตล์ของคุณ · ข้อมูลทั้งหมดถูกเก็บเป็นความลับ 🔒
            </p>

            {/* Trip schedule */}
            <Section icon="📅" title="วันเดินทาง">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-tmain mb-1 flex items-center gap-1.5"><Calendar size={14} /> วันที่เริ่ม</label>
                  <FlatpickrInput value={date} onChange={setDate} mode="date" minDate={todayStr} placeholder="เลือกวันที่" className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none cursor-pointer bg-white text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-tmain mb-1 flex items-center gap-1.5"><Calendar size={14} /> วันที่สิ้นสุด</label>
                  <FlatpickrInput value={endDate} onChange={setEndDate} mode="date" minDate={date || todayStr} placeholder="ไม่บังคับ" className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none cursor-pointer bg-white text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-tmain mb-1 flex items-center gap-1.5"><Users size={14} /> จำนวนผู้เดินทาง</label>
                <input type="number" value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)} min={1} max={50} className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm" />
              </div>
            </Section>

            {/* Section 1 */}
            <Section icon="👤" title="ส่วนที่ 1: ข้อมูลผู้เดินทาง" sub="Traveler Information">
              <div className="grid grid-cols-2 gap-3">
                <Field label="ชื่อ-นามสกุล" value={travelerName} onChange={setTravelerName} placeholder="ชื่อ-นามสกุล" />
                <Field label="อายุ" value={travelerAge} onChange={setTravelerAge} type="number" placeholder="อายุ" />
              </div>
              <Field label="ช่องทางติดต่อหลัก (Line / WhatsApp / WeChat)" value={contactChannel} onChange={setContactChannel} placeholder="เช่น Line: chillgo" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="ผู้ติดต่อฉุกเฉิน" value={emergencyContact} onChange={setEmergencyContact} placeholder="ชื่อ + ความสัมพันธ์ + เบอร์" optional />
                <Field label="ช่องทางติดต่อฉุกเฉิน" value={emergencyChannel} onChange={setEmergencyChannel} placeholder="เบอร์ / Line" optional />
              </div>
              <p className="text-xs text-tmuted">📋 กรุณากรอกผู้ติดต่อฉุกเฉินที่ไม่ใช่ผู้เดินทาง เพื่อความปลอดภัยของคุณ</p>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-tmain">รายชื่อสมาชิกในกลุ่ม (ไม่รวมผู้จอง)</label>
                  <button type="button" onClick={addMember} className="text-xs bg-primary/20 hover:bg-primary/30 text-tmain px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1"><Plus size={12} /> เพิ่ม</button>
                </div>
                {groupMembers.length === 0 && <p className="text-xs text-tmuted bg-primary-light rounded-xl p-3 text-center">เดินทางคนเดียว หรือกด "เพิ่ม" เพื่อใส่สมาชิก</p>}
                {groupMembers.map((m, i) => (
                  <div key={i} className="bg-primary-light rounded-xl p-3 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-tmuted">สมาชิกคนที่ {i + 1}</span>
                      <button type="button" onClick={() => removeMember(i)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="ชื่อ-นามสกุล" value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} className="col-span-2 px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                      <input placeholder="อายุ" value={m.age} onChange={(e) => updateMember(i, 'age', e.target.value)} className="px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                    </div>
                    <input placeholder="หมายเหตุ (ไม่บังคับ)" value={m.note} onChange={(e) => updateMember(i, 'note', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-primary-dark/30 text-xs outline-none focus:border-primary" />
                  </div>
                ))}
              </div>
            </Section>

            {/* Section 2 */}
            <Section icon="✨" title="ส่วนที่ 2: ความชอบและไลฟ์สไตล์" sub="Customizing Your Trip">
              <div>
                <label className="text-sm font-medium text-tmain mb-1.5 block">ระดับความฟิต</label>
                <ChoiceRow options={FITNESS_LEVELS} value={fitnessLevel} onChange={setFitnessLevel} />
              </div>
              <div>
                <label className="text-sm font-medium text-tmain mb-1.5 block">งบประมาณต่อวัน</label>
                <ChoiceRow options={BUDGETS} value={dailyBudget} onChange={setDailyBudget} />
              </div>
              <Field label="สิ่งที่ชื่นชอบเป็นพิเศษ 🌟" value={likes} onChange={setLikes} placeholder="เช่น ธรรมชาติ, คาเฟ่, ถ่ายรูป, Street Food" optional rows={2} />
              <Field label="สิ่งที่ไม่ชอบหรือไม่ต้องการ 🚫" value={dislikes} onChange={setDislikes} placeholder="เช่น ไม่ชอบเดินขึ้นเขา, ไม่ชอบเสียงดัง" optional rows={2} />
              <Field label="ไลฟ์สไตล์ส่วนตัว 🌅" value={lifestyle} onChange={setLifestyle} placeholder="เช่น ตื่นเช้า/นอนดึก, ชอบเที่ยวแบบพักผ่อน" optional rows={2} />
              <Field label="ความคาดหวังพิเศษในทริปนี้ 💫" value={specialExpectations} onChange={(v) => { setSpecialExpectations(v); const c = checkContentViolation(v); setViolation(c.isViolation ? (c.reason || '') : ''); }} placeholder="เช่น ต้องการความเป็นส่วนตัวสูง, ถ่ายรูปสวยๆ" optional rows={2} />
            </Section>

            {/* Section 3 */}
            <Section icon="🛡️" title="ส่วนที่ 3: ข้อมูลเพื่อความปลอดภัย" sub="Safety & Health">
              <div>
                <label className="text-sm font-medium text-tmain mb-1.5 block">หมู่เลือด <span className="text-tmuted font-normal">(ไม่บังคับ)</span></label>
                <ChoiceRow options={BLOOD_TYPES} value={bloodType} onChange={setBloodType} />
              </div>
              <Field label="โรคประจำตัว" value={medicalConditions} onChange={setMedicalConditions} placeholder="ระบุถ้ามี" optional rows={2} />
              <Field label="ยาที่ต้องทานประจำ" value={regularMedication} onChange={setRegularMedication} placeholder="ชื่อยา + เวลาที่ต้องทาน" optional rows={2} />
              <Field label="การแพ้อาหาร / ส่วนผสม ⚠️" value={foodAllergies} onChange={setFoodAllergies} placeholder="เช่น แพ้ถั่ว, แพ้อาหารทะเล, ทานมังสวิรัติ" optional rows={2} />
              <p className="text-xs text-tmuted">💡 ข้อมูลสุขภาพไม่บังคับ · หากแจ้งไว้ ทีมงานจะใช้เพื่อดูแลความปลอดภัยระหว่างทริปเท่านั้น และเก็บเป็นความลับ</p>
            </Section>

            {/* Section 4 */}
            <Section icon="✅" title="ส่วนที่ 4: ยืนยันข้อมูล" sub="Confirmation & Consent">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={consentData} onChange={(e) => setConsentData(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                <span className="text-xs text-tmain">ฉันยอมรับการเก็บรักษาข้อมูลส่วนบุคคลตามนโยบายการให้บริการของ ChillGo</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={consentHealth} onChange={(e) => setConsentHealth(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                <span className="text-xs text-tmain">ฉันยินยอมให้ทีมงานใช้ข้อมูลสุขภาพเพื่อการดูแลที่ปลอดภัยและเหมาะสมระหว่างทริป</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={consentTruth} onChange={(e) => setConsentTruth(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                <span className="text-xs text-tmain">ข้อมูลทั้งหมดที่กรอกเป็นความจริงและเป็นปัจจุบัน</span>
              </label>
              <Field label="ลงชื่อผู้เดินทาง" value={signature} onChange={setSignature} placeholder="พิมพ์ชื่อ-นามสกุลเพื่อยืนยัน" />
            </Section>

            {violation && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-2.5 flex items-start gap-2">
                <AlertTriangle size={14} className="text-danger mt-0.5 flex-shrink-0" />
                <p className="text-xs text-tmain">{violation}</p>
              </div>
            )}
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-sm text-tmain">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !date || !travelerName || !signature || !consentData || !consentTruth || !!violation}
              className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-40"
            >
              {loading ? <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" /> : <><Send size={18} /> ยืนยันการจอง</>}
            </button>
            <p className="text-center text-[11px] text-tmuted">🔒 ข้อมูลทั้งหมดถูกเก็บเป็นความลับ · จองผ่าน ChillGo เท่านั้น</p>
          </form>
        )}
      </div>
    </div>
  );
}
