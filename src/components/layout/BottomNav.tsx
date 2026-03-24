'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarCheck, MessageCircle, Tag, User } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';

const customerNav = [
  { href: '/feed', icon: Home, label: 'หน้าหลัก' },
  { href: '/booking', icon: CalendarCheck, label: 'การจอง' },
  { href: '/chat', icon: MessageCircle, label: 'ข้อความ' },
  { href: '/dashboard/customer', icon: User, label: 'บัญชี' },
];

const partnerNav = [
  { href: '/feed', icon: Home, label: 'หน้าหลัก' },
  { href: '/dashboard/partner', icon: Tag, label: 'จัดการ' },
  { href: '/chat', icon: MessageCircle, label: 'ข้อความ' },
  { href: '/dashboard/customer', icon: User, label: 'บัญชี' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const nav = user?.role === 'partner' ? partnerNav : customerNav;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? 'text-secondary' : 'text-gray-400'
              }`}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
