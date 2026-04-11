'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const loginEmail = email.includes('@') ? email : `${email}@chillgo.local`;
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : error.message);
      setLoading(false);
      return;
    }
    window.location.href = '/';
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/verify` },
    });
  };

  const handleLineLogin = () => {
    const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const redirectUri = encodeURIComponent(`${baseUrl}/auth/line/callback`);
    const state = Math.random().toString(36).substring(2);
    const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-primary-light flex flex-col">
      <nav className="sticky top-0 z-50 bg-primary shadow-md shadow-primary-dark/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/feed" className="flex items-center"><img src="/logo.png" alt="ChillGo" className="h-10 w-auto" /></Link>
            <div className="flex items-center gap-2">
              <Link href="/feed" className="px-4 py-2 text-sm font-medium text-tmain hover:bg-primary-dark/50 rounded-lg transition">หน้าหลัก</Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold bg-secondary text-tmain rounded-lg hover:bg-secondary/90 transition">สมัครสมาชิก</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12 animate-blur-in">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-primary-dark/20 p-8">
            <div className="text-center mb-6">
              <img src="/logo.png" alt="ChillGo" className="h-16 w-auto mx-auto mb-2" />
              <h2 className="text-xl font-bold text-tmain">เข้าสู่ระบบ</h2>
              <p className="text-tmuted text-sm mt-1">ยินดีต้อนรับกลับมา!</p>
            </div>

            {error && <div className="bg-danger/10 border border-danger/20 text-tmain rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tmain mb-1">อีเมล หรือ ชื่อผู้ใช้</label>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-tmain" placeholder="your@email.com หรือ admin" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-tmain mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-tmain pr-12" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tmuted">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary-dark text-tmain font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/30">
                {loading ? <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><LogIn size={18} /> เข้าสู่ระบบ</>}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary-dark/20" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-tmuted">หรือเข้าสู่ระบบด้วย</span></div>
            </div>

            <div className="space-y-3">
              <button onClick={handleGoogleLogin} className="w-full h-12 bg-white border border-primary-dark/20 rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-tmain hover:bg-gray-50 transition">
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                เข้าสู่ระบบด้วย Google
              </button>
              <button onClick={handleLineLogin} className="w-full h-12 bg-[#06C755] rounded-xl flex items-center justify-center gap-3 text-sm font-semibold text-white hover:bg-[#05b04c] transition">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                เข้าสู่ระบบด้วย LINE
              </button>
            </div>

            <p className="text-center text-tmuted mt-6 text-sm">
              ยังไม่มีบัญชี?{' '}
              <Link href="/auth/register" className="text-secondary font-semibold hover:underline">สมัครสมาชิก</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
