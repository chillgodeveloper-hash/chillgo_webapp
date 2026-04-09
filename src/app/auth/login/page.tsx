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

      <div className="flex-1 flex items-center justify-center px-4 py-12">
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
