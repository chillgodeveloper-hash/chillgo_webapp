'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { validateFile } from '@/lib/moderation';
import {
  User, LogOut, ChevronRight, Shield, Bell, HelpCircle,
  X, Camera, Save, Eye, EyeOff, Check
} from 'lucide-react';

type ModalType = 'edit' | 'security' | 'notifications' | 'help' | null;

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 lg:px-0">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-text font-bold text-2xl">{user?.full_name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user?.full_name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-primary-light text-primary-text px-3 py-0.5 rounded-full font-medium capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button onClick={() => setActiveModal('edit')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-50">
            <User size={20} className="text-gray-500" />
            <span className="flex-1 text-sm font-medium text-gray-700">แก้ไขโปรไฟล์</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          <button onClick={() => setActiveModal('notifications')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-50">
            <Bell size={20} className="text-gray-500" />
            <span className="flex-1 text-sm font-medium text-gray-700">การแจ้งเตือน</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          <button onClick={() => setActiveModal('security')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-50">
            <Shield size={20} className="text-gray-500" />
            <span className="flex-1 text-sm font-medium text-gray-700">ความปลอดภัย</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          <button onClick={() => setActiveModal('help')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition">
            <HelpCircle size={20} className="text-gray-500" />
            <span className="flex-1 text-sm font-medium text-gray-700">ช่วยเหลือ</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

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
    </AppLayout>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg text-gray-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuthStore();
  const supabase = createClient();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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
      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="แก้ไขโปรไฟล์" onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={32} className="text-success" /></div>
          <p className="font-semibold text-gray-800">บันทึกสำเร็จ!</p>
        </div>
      ) : (
        <div className="space-y-5">
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
            <label className="text-sm font-medium text-gray-700 mb-1 block">ชื่อ-นามสกุล</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">อีเมล</label>
            <input type="text" value={user?.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
          </div>
          <button onClick={handleSave} disabled={loading || !fullName.trim()} className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40">
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
          <p className="font-semibold text-gray-800">เปลี่ยนรหัสผ่านสำเร็จ!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">เปลี่ยนรหัสผ่าน</h3>
          {error && <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">รหัสผ่านใหม่</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none pr-12" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNew ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">ยืนยันรหัสผ่านใหม่</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
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
          <p className="font-semibold text-gray-800">บันทึกสำเร็จ!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-gray-700">การจอง</p><p className="text-xs text-gray-500">แจ้งเตือนเมื่อมีการอัปเดตการจอง</p></div>
            <input type="checkbox" checked={bookingNotif} onChange={(e) => setBookingNotif(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
          </label>
          <label className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-gray-700">ข้อความแชท</p><p className="text-xs text-gray-500">แจ้งเตือนเมื่อได้รับข้อความใหม่</p></div>
            <input type="checkbox" checked={chatNotif} onChange={(e) => setChatNotif(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
          </label>
          <label className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-gray-700">โปรโมชัน</p><p className="text-xs text-gray-500">แจ้งเตือนโปรโมชันและข้อเสนอพิเศษ</p></div>
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
        <p className="text-sm text-gray-500 mb-4">คำถามที่พบบ่อย</p>
        {faqs.map((faq, i) => (
          <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
            <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition">
              <span className="text-sm font-medium text-gray-700">{faq.q}</span>
              <ChevronRight size={16} className={`text-gray-400 transition-transform ${openIndex === i ? 'rotate-90' : ''}`} />
            </button>
            {openIndex === i && <div className="px-4 pb-4"><p className="text-sm text-gray-600">{faq.a}</p></div>}
          </div>
        ))}
        <div className="mt-6 p-4 bg-primary-light rounded-xl text-center">
          <p className="text-sm font-medium text-gray-700">ยังมีคำถาม?</p>
          <p className="text-xs text-gray-500 mt-1">ส่งอีเมลมาที่ support@chillgo.com</p>
        </div>
      </div>
    </ModalWrapper>
  );
}
