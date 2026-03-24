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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('success');
        setTimeout(() => router.push('/feed'), 2000);
      } else {
        setStatus('error');
      }
    };
    handleVerify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-secondary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">กำลังยืนยันอีเมล...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-success" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันสำเร็จ!</h2>
            <p className="text-gray-500">กำลังพาคุณไปหน้าหลัก...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-500 mb-4">ลิงก์อาจหมดอายุ กรุณาลองใหม่</p>
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
