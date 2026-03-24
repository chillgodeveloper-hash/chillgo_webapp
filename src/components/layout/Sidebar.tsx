'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  Home, CalendarCheck, MessageCircle, User, Tag,
  LayoutDashboard, Users, FileText, BarChart3,
  Settings, LogOut, ChevronDown
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const supabase = createClient();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const adminNav = [
    { href: '/dashboard/admin', icon: LayoutDashboard, label: 'แดชบอร์ด' },
    { href: '/dashboard/admin/partners', icon: Users, label: 'จัดการพาร์ทเนอร์' },
    { href: '/dashboard/admin/customers', icon: Users, label: 'จัดการลูกค้า' },
    {
      icon: CalendarCheck, label: 'การจอง', children: [
        { href: '/dashboard/admin/bookings', label: 'รายการจอง' },
        { href: '/dashboard/admin/bookings/pending', label: 'รออนุมัติ' },
      ]
    },
    {
      icon: BarChart3, label: 'รายงาน', children: [
        { href: '/dashboard/admin/reports/revenue', label: 'รายได้' },
        { href: '/dashboard/admin/reports/partners', label: 'พาร์ทเนอร์' },
      ]
    },
    { href: '/dashboard/admin/settings', icon: Settings, label: 'ตั้งค่าระบบ' },
  ];

  const partnerNav = [
    { href: '/feed', icon: Home, label: 'หน้าหลัก' },
    { href: '/dashboard/partner', icon: Tag, label: 'จัดการโพสต์' },
    { href: '/booking', icon: CalendarCheck, label: 'การจอง' },
    { href: '/chat', icon: MessageCircle, label: 'ข้อความ' },
    { href: '/dashboard/customer', icon: User, label: 'โปรไฟล์' },
  ];

  const customerNav = [
    { href: '/feed', icon: Home, label: 'หน้าหลัก' },
    { href: '/booking', icon: CalendarCheck, label: 'การจอง' },
    { href: '/chat', icon: MessageCircle, label: 'ข้อความ' },
    { href: '/dashboard/customer', icon: User, label: 'โปรไฟล์' },
  ];

  const nav = user?.role === 'admin' ? adminNav : user?.role === 'partner' ? partnerNav : customerNav;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-dark-DEFAULT text-white min-h-screen sticky top-0">
      <div className="p-6 border-b border-white/10">
        <Link href="/feed" className="font-display text-2xl font-extrabold text-primary">
          #ChillGo
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {nav.map((item: any) => {
          if (item.children) {
            const isExpanded = expandedMenus.includes(item.label);
            const hasActive = item.children.some((c: any) => pathname.startsWith(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    hasActive ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.children.map((child: any) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === child.href ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const active = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {user?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
