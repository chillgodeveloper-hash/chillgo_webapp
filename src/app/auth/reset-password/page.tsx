'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Eye, EyeOff, KeyRound, CheckCircle, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'verifying' | 'ready' | 'invalid' | 'done'>('verifying');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [invalidReason, setInvalidReason] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // ตรวจลิงก์จากอีเมลแล้วสร้าง session สำหรับการรีเซ็ต
  useEffect(() => {
    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        // 1) ถ้า Supabase แนบ error มากับ URL (เช่น ลิงก์หมดอายุ/ถูกใช้แล้ว) ให้แสดงเหตุผลจริง
        const urlError =
          url.searchParams.get('error_description') || hash.get('error_description') ||
          url.searchParams.get('error') || hash.get('error');
        if (urlError) {
          setInvalidReason(decodeURIComponent(urlError.replace(/\+/g, ' ')));
          setStatus('invalid');
          return;
        }

        // 2) ฟอร์แมตอีเมลเริ่มต้นรุ่นใหม่: ?token_hash=...&type=recovery (ใช้ข้ามเบราว์เซอร์/อุปกรณ์ได้)
        const token_hash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type: type as 'recovery',
            token_hash,
          });
          if (!error) { setStatus('ready'); return; }
        }

        // 3) PKCE flow: ?code=...
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) { setStatus('ready'); return; }
        }

        // 4) Implicit flow: #access_token & #refresh_token
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) { setStatus('ready'); return; }
        }

        // 5) เผื่อ supabase-js (detectSessionInUrl) ตั้ง session ให้อัตโนมัติแล้ว
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { setStatus('ready'); return; }

        setStatus('invalid');
      } catch {
        setStatus('invalid');
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setStatus('done');
    setLoading(false);
    setTimeout(() => router.push('/auth/login'), 2000);
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 size={48} className="text-secondary animate-spin mx-auto mb-4" />
          <p className="text-tmuted">กำลังตรวจสอบลิงก์...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-tmain mb-2">ลิงก์ไม่ถูกต้อง</h2>
          <p className="text-tmuted mb-6">ลิงก์อาจหมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง</p>
          {invalidReason && (
            <p className="text-tmuted/70 text-xs mb-6 -mt-4">({invalidReason})</p>
          )}
          <Link
            href="/auth/forgot-password"
            className="inline-block bg-primary hover:bg-primary-dark text-tmain font-semibold px-8 py-3 rounded-xl transition shadow-lg shadow-primary/30"
          >
            ขอลิงก์ใหม่
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-tmain mb-2">ตั้งรหัสผ่านใหม่สำเร็จ!</h2>
          <p className="text-tmuted">กำลังพาคุณไปหน้าเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <KeyRound size={28} className="text-primary-dark" />
            </div>
            <h2 className="text-2xl font-bold text-tmain mb-1">ตั้งรหัสผ่านใหม่</h2>
            <p className="text-tmuted text-sm">กรอกรหัสผ่านใหม่ที่คุณต้องการใช้</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tmain mb-1">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition pr-12"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tmuted hover:text-tmuted"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-tmain mb-1">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-tmain font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/30"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound size={18} />
                  บันทึกรหัสผ่านใหม่
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
