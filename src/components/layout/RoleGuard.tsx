'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

type CheckState = 'checking' | 'ok' | 'denied' | 'unauth';

// Client-side role gate. Wrap a route's layout with <RoleGuard allow={[...]}>.
// Checks the signed-in user's role against `allow` before rendering children;
// redirects unauthenticated users to login and shows a denial screen otherwise.
export default function RoleGuard({ allow, children }: { allow: string[]; children: ReactNode }) {
  const [state, setState] = useState<CheckState>('checking');
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setState('unauth');
        router.push('/auth/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (cancelled) return;
      setState(profile && allow.includes(profile.role) ? 'ok' : 'denied');
    };

    verify();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (state === 'checking' || state === 'unauth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light">
        <div className="text-center">
          <Loader2 size={40} className="text-secondary animate-spin mx-auto mb-3" />
          <p className="text-tmuted">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={40} className="text-danger" />
          </div>
          <h2 className="text-2xl font-bold text-tmain mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-tmuted mb-6">หน้านี้ไม่สามารถเข้าถึงได้ด้วยบัญชีของคุณ</p>
          <Link href="/feed" className="inline-block bg-primary hover:bg-primary-dark text-tmain font-semibold px-8 py-3 rounded-xl transition">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
