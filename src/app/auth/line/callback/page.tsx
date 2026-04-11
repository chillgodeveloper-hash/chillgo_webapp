'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function LineCallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('การเข้าสู่ระบบด้วย LINE ถูกยกเลิก');
      setLoading(false);
      return;
    }

    if (!code) {
      setError('ไม่พบรหัสยืนยัน');
      setLoading(false);
      return;
    }

    const handleCallback = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const redirectUri = `${baseUrl}/auth/line/callback`;

        const res = await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'เกิดข้อผิดพลาด');
          setLoading(false);
          return;
        }

        if (data.session?.access_token) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          window.location.href = '/';
        } else {
          setError('ไม่สามารถสร้าง session ได้');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาด');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-success animate-spin mx-auto mb-3" />
          <p className="text-tmain font-medium">กำลังเข้าสู่ระบบด้วย LINE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-tmain font-medium mb-2">เข้าสู่ระบบไม่สำเร็จ</p>
        <p className="text-sm text-tmuted mb-4">{error}</p>
        <Link href="/auth/login" className="inline-block bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-3 rounded-xl transition">กลับหน้าเข้าสู่ระบบ</Link>
      </div>
    </div>
  );
}

export default function LineCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-success animate-spin mx-auto mb-3" />
          <p className="text-tmain font-medium">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <LineCallbackContent />
    </Suspense>
  );
}
