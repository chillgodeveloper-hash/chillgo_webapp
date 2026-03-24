'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-tmain mb-2">ลงทะเบียนสำเร็จ!</h2>
          <p className="text-tmuted mb-6">
            กรุณาตรวจสอบอีเมล <strong className="text-tmain">{email}</strong> เพื่อยืนยันบัญชีของคุณ
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold px-8 py-3 rounded-xl transition shadow-lg shadow-primary/30"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-primary-dark to-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-20 w-64 h-64 bg-orange-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <h1 className="font-display text-6xl font-extrabold text-dark-DEFAULT mb-4">#ChillGo</h1>
          <p className="text-xl text-dark-DEFAULT/70 font-medium">เริ่มต้นการเดินทางของคุณ</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-display text-4xl font-extrabold text-primary-text">#ChillGo</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-tmain mb-1">สมัครสมาชิก</h2>
            <p className="text-tmuted mb-6">สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</p>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tmain mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="สมชาย ใจดี"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-tmain mb-1">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-tmain mb-1">รหัสผ่าน</label>
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
                <label className="block text-sm font-medium text-tmain mb-1">ยืนยันรหัสผ่าน</label>
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
                className="w-full bg-secondary hover:bg-secondary/90 text-tmain font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-secondary/30"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={20} />
                    สมัครสมาชิก
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-tmuted mt-6">
              มีบัญชีแล้ว?{' '}
              <Link href="/auth/login" className="text-secondary font-semibold hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
