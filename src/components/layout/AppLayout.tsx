'use client';

import { useAuth } from '@/hooks/useAuth';
import Navbar from './Navbar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children, requireAuth = false }: { children: React.ReactNode; requireAuth?: boolean }) {
  const { user, isLoading } = useAuth(requireAuth ? 'any' : undefined);

  if (isLoading && requireAuth) {
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
    <div className="min-h-screen bg-primary-light">
      <Navbar />
      <main className="animate-page-enter">
        {children}
      </main>
    </div>
  );
}
