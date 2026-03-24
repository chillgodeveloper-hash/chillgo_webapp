'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = email.includes('@') ? email : `${email}@chillgo.local`;
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        : error.message
      );
      setLoading(false);
      return;
    }

    router.push('/feed');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <h1 className="font-display text-6xl font-extrabold text-dark-DEFAULT mb-4 tracking-tight">#ChillGo</h1>
          <p className="text-xl text-dark-DEFAULT/70 font-medium">จัดทริปง่าย ๆ สไตล์คุณ</p>
          <div className="mt-8 flex gap-4 justify-center">
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-dark-DEFAULT">🗺️</p>
              <p className="text-sm font-medium text-dark-DEFAULT/80 mt-1">ไกด์มืออาชีพ</p>
            </div>
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-dark-DEFAULT">🚗</p>
              <p className="text-sm font-medium text-dark-DEFAULT/80 mt-1">รถเช่าทั่วไทย</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-display text-4xl font-extrabold text-primary-dark">#ChillGo</h1>
            <p className="text-gray-500 mt-1">จัดทริปง่าย ๆ สไตล์คุณ</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">เข้าสู่ระบบ</h2>
            <p className="text-gray-500 mb-6">ยินดีต้อนรับกลับมา!</p>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล หรือ ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="your@email.com หรือ admin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/30 hover:shadow-primary/50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={20} />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-6">
              ยังไม่มีบัญชี?{' '}
              <Link href="/auth/register" className="text-secondary font-semibold hover:underline">
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
