'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth('admin');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light">
        <div className="text-center">
          <Loader2 size={40} className="text-secondary animate-spin mx-auto mb-3" />
          <p className="text-tmuted">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={40} className="text-danger" />
          </div>
          <h2 className="text-2xl font-bold text-tmain mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-tmuted mb-6">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
          <Link href="/feed" className="inline-block bg-primary hover:bg-primary-dark text-tmain font-semibold px-8 py-3 rounded-xl transition">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
