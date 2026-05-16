'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleVerify = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) { setStatus('success'); setTimeout(() => router.push('/feed'), 1500); return; }
        }

        const hash = window.location.hash.substring(1);
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) { setStatus('success'); setTimeout(() => router.push('/feed'), 1500); return; }
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) { setStatus('success'); setTimeout(() => router.push('/feed'), 1500); return; }

        setStatus('error');
      } catch {
        setStatus('error');
      }
    };
    handleVerify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-secondary animate-spin mx-auto mb-4" />
            <p className="text-tmuted">กำลังยืนยันอีเมล...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-success" />
            </div>
            <h2 className="text-2xl font-bold text-tmain mb-2">ยืนยันสำเร็จ!</h2>
            <p className="text-tmuted">กำลังพาคุณไปหน้าหลัก...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-tmain mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-tmuted mb-4">ลิงก์อาจหมดอายุ กรุณาลองใหม่</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold px-6 py-2 rounded-xl transition"
            >
              กลับหน้าเข้าสู่ระบบ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
