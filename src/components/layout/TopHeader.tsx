'use client';

import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import Link from 'next/link';

export default function TopHeader() {
  const { user } = useAuthStore();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-primary backdrop-blur-lg shadow-md shadow-primary-dark/30">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/feed" className="font-display text-xl font-extrabold text-tmain">
          #ChillGo
        </Link>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center text-tmain hover:bg-white/80 transition">
            <Search size={18} />
          </button>
          <button className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center text-tmain hover:bg-white/80 transition relative">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-primary" />
          </button>
          <Link href="/dashboard/customer" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-tmain font-bold text-sm shadow-sm">
            {user?.full_name?.charAt(0) || '?'}
          </Link>
        </div>
      </div>
    </header>
  );
}
