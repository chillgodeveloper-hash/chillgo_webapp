'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { validateFile } from '@/lib/moderation';
import {
  User, LogOut, ChevronRight, Shield, Bell, HelpCircle,
  X, Camera, Save, Eye, EyeOff, Check, RefreshCw, Map, ShoppingBag,
  MessageSquare, Navigation
} from 'lucide-react';

type ModalType = 'edit' | 'security' | 'notifications' | 'help' | 'switch-role' | 'switch-partner' | null;

export default function CustomerDashboard() {
  const { user, setUser, partnerProfile, setPartnerProfile } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    if (!user || user.role !== 'partner') return;
    const fetchPP = async () => {
      const { data } = await supabase.from('partner_profiles').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
      if (data) setPartnerProfile(data);
    };
    fetchPP();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const categoryLabel = partnerProfile?.category === 'guide' ? 'ไกด์' : partnerProfile?.category === 'driver' ? 'คนขับรถ' : partnerProfile?.category === 'translator' ? 'ล่าม' : '';

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 lg:px-0 py-6 lg:py-8">
        <div className="bg-white rounded-3xl p-6 border border-primary-dark/20 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-text font-bold text-2xl">{user?.full_name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-tmain">{user?.full_name}</h2>
              <p className="text-sm text-tmuted">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-primary-light text-primary-text px-3 py-0.5 rounded-full font-medium capitalize">
                  {user?.role}
                </span>
                {user?.role === 'partner' && categoryLabel && (
                  <span className="text-xs bg-secondary/20 text-tmain px-3 py-0.5 rounded-full font-medium">
                    {categoryLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
          <button onClick={() => setActiveModal('edit')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary-light transition border-b border-primary-dark/10">
            <User size={20} className="text-tmuted" />
            <span className="flex-1 text-sm font-medium text-tmain">แก้ไขโปรไฟล์</span>
            <ChevronRight size={16} className="text-tmuted" />
          </button>
          <button onClick={() => setActiveModal('notifications')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary-light transition border-b border-primary-dark/10">
            <Bell size={20} className="text-tmuted" />
            <span className="flex-1 text-sm font-medium text-tmain">การแจ้งเตือน</span>
            <ChevronRight size={16} className="text-tmuted" />
          </button>
          <button onClick={() => setActiveModal('security')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary-light transition border-b border-primary-dark/10">
            <Shield size={20} className="text-tmuted" />
            <span className="flex-1 text-sm font-medium text-tmain">ความปลอดภัย</span>
            <ChevronRight size={16} className="text-tmuted" />
          </button>
          <button onClick={() => setActiveModal('help')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary-light transition">
            <HelpCircle size={20} className="text-tmuted" />
            <span className="flex-1 text-sm font-medium text-tmain">ช่วยเหลือ</span>
            <ChevronRight size={16} className="text-tmuted" />
          </button>
        </div>

        {user?.role === 'partner' ? (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setActiveModal('switch-role')}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-tmain font-semibold py-3 rounded-2xl transition shadow-sm"
            >
              <RefreshCw size={16} /> เปลี่ยนเป็นลูกค้า
            </button>
            <button
              onClick={() => setActiveModal('switch-partner')}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-secondary/40 text-tmain font-semibold py-3 rounded-2xl hover:bg-secondary/10 transition"
            >
              <RefreshCw size={16} /> เปลี่ยน Partner
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveModal('switch-role')}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-tmain font-semibold py-3 rounded-2xl transition shadow-sm"
          >
            <RefreshCw size={18} /> เปลี่ยนเป็นพาร์ทเนอร์
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-white border border-danger/20 text-danger font-medium py-3 rounded-2xl hover:bg-danger/5 transition"
        >
          <LogOut size={18} /> ออกจากระบบ
        </button>
      </div>

      {activeModal === 'edit' && <EditProfileModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'security' && <SecurityModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'notifications' && <NotificationsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'help' && <HelpModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'switch-role' && <SwitchRoleModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'switch-partner' && <SwitchPartnerModal onClose={() => setActiveModal(null)} />}
    </AppLayout>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-primary-dark/15 p-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg text-tmain">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary-dark/30 transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser, partnerProfile, setPartnerProfile } = useAuthStore();
  const supabase = createClient();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isPartner = user?.role === 'partner' && partnerProfile;
  const [pp, setPP] = useState<Record<string, any>>({
    business_name: partnerProfile?.business_name || '',
    description: (partnerProfile as any)?.description || '',
    phone: (partnerProfile as any)?.phone || '',
    line_id: (partnerProfile as any)?.line_id || '',
    wechat_id: (partnerProfile as any)?.wechat_id || '',
    contact_email: (partnerProfile as any)?.contact_email || '',
    address: (partnerProfile as any)?.address || '',
    special_routes: (partnerProfile as any)?.special_routes || '',
    bank_name: (partnerProfile as any)?.bank_name || '',
    bank_branch: (partnerProfile as any)?.bank_branch || '',
    account_name: (partnerProfile as any)?.account_name || '',
    account_number: (partnerProfile as any)?.account_number || '',
    promptpay: (partnerProfile as any)?.promptpay || '',
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file, 'avatar');
    if (!validation.valid) { setError(validation.error || ''); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
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
      }
      const { error: updateError } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setUser({ ...user, full_name: fullName, avatar_url: avatarUrl });

      if (isPartner && partnerProfile) {
        const { error: ppError } = await supabase.from('partner_profiles').update({
          business_name: pp.business_name,
          description: pp.description,
          phone: pp.phone,
          line_id: pp.line_id,
          wechat_id: pp.wechat_id,
          contact_email: pp.contact_email,
          address: pp.address,
          special_routes: pp.special_routes,
          bank_name: pp.bank_name,
          bank_branch: pp.bank_branch,
          account_name: pp.account_name,
          account_number: pp.account_number,
          promptpay: pp.promptpay,
        }).eq('id', partnerProfile.id);
        if (ppError) throw ppError;
        setPartnerProfile({ ...partnerProfile, ...pp } as any);
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const PInput = ({ label, name, rows }: { label: string; name: string; rows?: number }) => (
    <div>
      <label className="text-sm font-medium text-tmain mb-1 block">{label}</label>
      {rows ? (
        <textarea value={pp[name] || ''} onChange={e => setPP(prev => ({ ...prev, [name]: e.target.value }))} rows={rows} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm resize-none" />
      ) : (
        <input type="text" value={pp[name] || ''} onChange={e => setPP(prev => ({ ...prev, [name]: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm" />
      )}
    </div>
  );

  return (
    <ModalWrapper title="แก้ไขโปรไฟล์" onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={32} className="text-success" /></div>
          <p className="font-semibold text-tmain">บันทึกสำเร็จ!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 text-sm">{error}</div>}
          <div className="flex justify-center">
            <div className="relative">
              <div onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-80 transition border-2 border-primary/30">
                {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={28} className="text-primary-text" />}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Camera size={14} className="text-dark-DEFAULT" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-tmain mb-1 block">ชื่อ-นามสกุล</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-tmain mb-1 block">อีเมล</label>
            <input type="text" value={user?.email || ''} disabled className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 bg-primary-light/70 text-tmuted text-sm" />
          </div>

          {isPartner && (
            <>
              <hr className="border-primary-dark/10" />
              <p className="text-sm font-semibold text-tmain">ข้อมูลพาร์ทเนอร์</p>
              <PInput label="ชื่อธุรกิจ / ชื่อบริการ" name="business_name" />
              <PInput label="คำอธิบาย / แนะนำตัว" name="description" rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <PInput label="เบอร์โทรศัพท์" name="phone" />
                <PInput label="LINE ID" name="line_id" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PInput label="WeChat ID" name="wechat_id" />
                <PInput label="Email ติดต่อ" name="contact_email" />
              </div>
              <PInput label="ที่อยู่" name="address" rows={2} />
              <PInput label="เส้นทาง / พื้นที่ให้บริการ" name="special_routes" rows={2} />
              <hr className="border-primary-dark/10" />
              <p className="text-sm font-semibold text-tmain">บัญชีธนาคาร</p>
              <div className="grid grid-cols-2 gap-3">
                <PInput label="ชื่อธนาคาร" name="bank_name" />
                <PInput label="สาขา" name="bank_branch" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PInput label="ชื่อบัญชี" name="account_name" />
                <PInput label="เลขที่บัญชี" name="account_number" />
              </div>
              <PInput label="PromptPay / พร้อมเพย์" name="promptpay" />
            </>
          )}

          <button onClick={handleSave} disabled={loading || !fullName.trim()} className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40 sticky bottom-0">
            {loading ? <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" /> : <><Save size={18} /> บันทึก</>}
          </button>
        </div>
      )}
    </ModalWrapper>
  );
}

function SecurityModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    setError('');
    if (newPassword.length < 6) { setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (newPassword !== confirmPassword) { setError('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setError(error.message); } else { setSuccess(true); setTimeout(() => onClose(), 1500); }
    setLoading(false);
  };

  return (
    <ModalWrapper title="ความปลอดภัย" onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={32} className="text-success" /></div>
          <p className="font-semibold text-tmain">เปลี่ยนรหัสผ่านสำเร็จ!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-tmain">เปลี่ยนรหัสผ่าน</h3>
          {error && <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="text-sm font-medium text-tmain mb-1 block">รหัสผ่านใหม่</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none pr-12" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tmuted">{showNew ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-tmain mb-1 block">ยืนยันรหัสผ่านใหม่</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <button onClick={handleChangePassword} disabled={loading || !newPassword || !confirmPassword} className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40">
            {loading ? <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" /> : <><Shield size={18} /> เปลี่ยนรหัสผ่าน</>}
          </button>
        </div>
      )}
    </ModalWrapper>
  );
}

function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [bookingNotif, setBookingNotif] = useState(true);
  const [chatNotif, setChatNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <ModalWrapper title="การแจ้งเตือน" onClose={onClose}>
      {saved ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={32} className="text-success" /></div>
          <p className="font-semibold text-tmain">บันทึกสำเร็จ!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-tmain">การจอง</p><p className="text-xs text-tmuted">แจ้งเตือนเมื่อมีการอัปเดตการจอง</p></div>
            <input type="checkbox" checked={bookingNotif} onChange={(e) => setBookingNotif(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
          </label>
          <label className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-tmain">ข้อความแชท</p><p className="text-xs text-tmuted">แจ้งเตือนเมื่อได้รับข้อความใหม่</p></div>
            <input type="checkbox" checked={chatNotif} onChange={(e) => setChatNotif(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
          </label>
          <label className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-tmain">โปรโมชัน</p><p className="text-xs text-tmuted">แจ้งเตือนโปรโมชันและข้อเสนอพิเศษ</p></div>
            <input type="checkbox" checked={promoNotif} onChange={(e) => setPromoNotif(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
          </label>
          <button onClick={() => { setSaved(true); setTimeout(() => onClose(), 1000); }} className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <Save size={18} /> บันทึก
          </button>
        </div>
      )}
    </ModalWrapper>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const faqs = [
    { q: 'จองบริการอย่างไร?', a: 'เลือกบริการจากหน้าฟีด กดปุ่ม "จองเลย" กรอกรายละเอียด แล้วรอ Admin อนุมัติ เมื่ออนุมัติแล้วจะสามารถชำระเงินและเริ่มแชทกับพาร์ทเนอร์ได้' },
    { q: 'ชำระเงินผ่านช่องทางไหน?', a: 'ชำระเงินผ่าน Stripe รองรับบัตรเครดิต/เดบิต Visa, Mastercard และ PromptPay' },
    { q: 'ยกเลิกการจองได้ไหม?', a: 'สามารถยกเลิกได้ก่อนที่ Admin จะอนุมัติ หากอนุมัติแล้วกรุณาติดต่อผ่านแชท' },
    { q: 'ติดต่อทีมงานได้อย่างไร?', a: 'ส่งข้อความมาที่ support@chillgo.com หรือแชทผ่านระบบในแอป' },
  ];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ModalWrapper title="ช่วยเหลือ" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-tmuted mb-4">คำถามที่พบบ่อย</p>
        {faqs.map((faq, i) => (
          <div key={i} className="border border-primary-dark/20 rounded-xl overflow-hidden">
            <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-primary-light transition">
              <span className="text-sm font-medium text-tmain">{faq.q}</span>
              <ChevronRight size={16} className={`text-tmuted transition-transform ${openIndex === i ? 'rotate-90' : ''}`} />
            </button>
            {openIndex === i && <div className="px-4 pb-4"><p className="text-sm text-tmuted">{faq.a}</p></div>}
          </div>
        ))}
        <div className="mt-6 p-4 bg-primary-light rounded-xl text-center">
          <p className="text-sm font-medium text-tmain">ยังมีคำถาม?</p>
          <p className="text-xs text-tmuted mt-1">ส่งอีเมลมาที่ support@chillgo.com</p>
        </div>
      </div>
    </ModalWrapper>
  );
}

function SwitchRoleModal({ onClose }: { onClose: () => void }) {
  const { user, setUser, setPartnerProfile } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'guide' | 'driver' | 'translator' | null>(null);
  const [loading, setLoading] = useState(false);

  const isPartner = user?.role === 'partner';

  const handleSwitch = async () => {
    if (!user) return;
    setLoading(true);

    if (isPartner) {
      await supabase.from('profiles').update({ role: 'customer' }).eq('id', user.id);
      setUser({ ...user, role: 'customer' });
      setPartnerProfile(null);
      onClose();
      router.push('/feed');
    } else {
      if (!selectedCategory) { setLoading(false); return; }
      const { data: existingPP } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', selectedCategory)
        .maybeSingle();

      if (existingPP) {
        await supabase.from('profiles').update({ role: 'partner' }).eq('id', user.id);
        setUser({ ...user, role: 'partner' });
        setPartnerProfile(existingPP);
        onClose();
        router.push('/feed');
      } else {
        await supabase.from('partner_profiles').insert({
          user_id: user.id, category: selectedCategory, business_name: user.full_name,
          description: '', portfolio_images: [], is_verified: false,
        });
        await supabase.from('profiles').update({ role: 'partner' }).eq('id', user.id);
        setUser({ ...user, role: 'partner' });
        onClose();
        router.push('/dashboard/partner/setup');
      }
    }
    setLoading(false);
  };

  return (
    <ModalWrapper title={isPartner ? 'เปลี่ยนเป็นลูกค้า' : 'เปลี่ยนเป็นพาร์ทเนอร์'} onClose={onClose}>
      <div className="space-y-4">
        {isPartner ? (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={32} className="text-secondary" />
              </div>
              <p className="text-tmain font-semibold mb-2">เปลี่ยนเป็นโหมดลูกค้า</p>
              <p className="text-sm text-tmuted">คุณจะสามารถค้นหาและจองบริการได้ โปรไฟล์พาร์ทเนอร์ของคุณจะยังอยู่ สามารถสลับกลับได้ทุกเมื่อ</p>
            </div>
            <button onClick={handleSwitch} disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><RefreshCw size={18} /> เปลี่ยนเลย</>}
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Map size={32} className="text-secondary" />
              </div>
              <p className="text-tmain font-semibold mb-2">เปลี่ยนเป็นโหมดพาร์ทเนอร์</p>
              <p className="text-sm text-tmuted">เลือกประเภทบริการที่ต้องการ</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([['guide', '🗺️', 'ไกด์', 'text-secondary'], ['driver', '🚗', 'คนขับรถ', 'text-info'], ['translator', '🌐', 'ล่าม', 'text-purple-500']] as const).map(([key, icon, label]) => (
                <button key={key} onClick={() => setSelectedCategory(key)} className={`p-4 rounded-xl border-2 text-center transition-all ${selectedCategory === key ? 'border-primary bg-primary/20' : 'border-primary-dark/30 hover:bg-primary/10'}`}>
                  <span className="text-2xl block mb-1">{icon}</span>
                  <p className="font-semibold text-xs text-tmain">{label}</p>
                </button>
              ))}
            </div>
            <button onClick={handleSwitch} disabled={loading || !selectedCategory} className="w-full bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><RefreshCw size={18} /> เปลี่ยนเลย</>}
            </button>
          </>
        )}
      </div>
    </ModalWrapper>
  );
}

function SwitchPartnerModal({ onClose }: { onClose: () => void }) {
  const { user, setUser, partnerProfile, setPartnerProfile } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'guide' | 'driver' | 'translator' | null>(null);
  const [loading, setLoading] = useState(false);

  const currentCategory = partnerProfile?.category;

  const handleSwitch = async () => {
    if (!user || !selectedCategory) return;
    setLoading(true);

    const { data: existingPP } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', selectedCategory)
      .maybeSingle();

    if (existingPP) {
      setPartnerProfile(existingPP);
      onClose();
      router.push('/feed');
    } else {
      await supabase.from('partner_profiles').insert({
        user_id: user.id, category: selectedCategory, business_name: user.full_name,
        description: '', portfolio_images: [], is_verified: false,
      });
      const { data: newPP } = await supabase.from('partner_profiles').select('*').eq('user_id', user.id).eq('category', selectedCategory).single();
      if (newPP) setPartnerProfile(newPP);
      onClose();
      router.push('/dashboard/partner/setup');
    }
    setLoading(false);
  };

  const categories = [
    { key: 'guide' as const, icon: '🗺️', label: 'ไกด์นำเที่ยว' },
    { key: 'driver' as const, icon: '🚗', label: 'คนขับรถ' },
    { key: 'translator' as const, icon: '🌐', label: 'ล่าม / นักแปล' },
  ];

  return (
    <ModalWrapper title="เปลี่ยนประเภทพาร์ทเนอร์" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-tmuted text-center">ประเภทปัจจุบัน: <span className="font-semibold text-tmain">{currentCategory === 'guide' ? 'ไกด์' : currentCategory === 'driver' ? 'คนขับรถ' : 'ล่าม'}</span></p>
        <p className="text-sm font-medium text-tmain">เลือกประเภทที่ต้องการเปลี่ยน</p>
        <div className="grid grid-cols-3 gap-3">
          {categories.filter(c => c.key !== currentCategory).map(cat => (
            <button key={cat.key} onClick={() => setSelectedCategory(cat.key)} className={`p-4 rounded-xl border-2 text-center transition-all ${selectedCategory === cat.key ? 'border-primary bg-primary/20' : 'border-primary-dark/30 hover:bg-primary/10'}`}>
              <span className="text-2xl block mb-1">{cat.icon}</span>
              <p className="font-semibold text-xs text-tmain">{cat.label}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-tmuted text-center">ถ้ายังไม่เคยลงทะเบียนประเภทนี้ จะไปหน้าลงทะเบียนให้อัตโนมัติ</p>
        <button onClick={handleSwitch} disabled={loading || !selectedCategory} className="w-full bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40">
          {loading ? <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><RefreshCw size={18} /> เปลี่ยนเลย</>}
        </button>
      </div>
    </ModalWrapper>
  );
}