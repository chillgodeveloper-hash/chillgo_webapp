'use client';

import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopHeader from './TopHeader';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth('any');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-light">
        <div className="text-center">
          <Loader2 size={40} className="text-secondary animate-spin mx-auto mb-3" />
          <p className="text-tmuted">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-primary-light">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopHeader />
        <main className="flex-1 pb-20 lg:pb-6 lg:p-6 animate-page-enter">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
