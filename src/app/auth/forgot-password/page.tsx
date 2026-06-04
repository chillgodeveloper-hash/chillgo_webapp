'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Mail, Send, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // แสดงสำเร็จเสมอเพื่อไม่ให้เดาได้ว่าอีเมลไหนมีบัญชีอยู่ (กัน email enumeration)
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-tmain mb-2">ส่งลิงก์แล้ว!</h2>
          <p className="text-tmuted mb-6">
            หากมีบัญชีที่ใช้อีเมล <strong className="text-tmain">{email}</strong> เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบอีเมลของคุณ
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-primary hover:bg-primary-dark text-tmain font-semibold px-8 py-3 rounded-xl transition shadow-lg shadow-primary/30"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="ChillGo" className="h-16 w-auto mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-tmain mb-1">ลืมรหัสผ่าน?</h2>
            <p className="text-tmuted text-sm">กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tmain mb-1">อีเมล</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tmuted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-primary-dark/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="your@email.com"
                  required
                />
              </div>
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
                  <Send size={18} />
                  ส่งลิงก์รีเซ็ตรหัสผ่าน
                </>
              )}
            </button>
          </form>

          <Link href="/auth/login" className="flex items-center justify-center gap-1 text-tmuted hover:text-tmain mt-6 text-sm">
            <ArrowLeft size={16} />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
