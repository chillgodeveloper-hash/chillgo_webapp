'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { LogOut, ChevronDown, User, CalendarCheck, MessageCircle, Tag, LayoutDashboard, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const supabase = createClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel('navbar-notif')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const customerMenu = [
    { href: '/feed', label: 'หน้าหลัก' },
    { href: '/booking', label: 'การจอง' },
    { href: '/chat', label: 'ข้อความ' },
  ];

  const partnerMenu = [
    { href: '/dashboard/partner', label: 'จัดการโพสต์' },
    { href: '/booking', label: 'การจอง' },
    { href: '/chat', label: 'ข้อความ' },
  ];

  const adminMenu = [
    { href: '/feed', label: 'หน้าหลัก' },
    { href: '/dashboard/admin', label: 'แดชบอร์ด' },
    { href: '/dashboard/admin/bookings', label: 'การจอง' },
    { href: '/dashboard/admin/partners', label: 'พาร์ทเนอร์' },
    { href: '/dashboard/admin/reports/revenue', label: 'รายงาน' },
  ];

  const menu = user?.role === 'admin' ? adminMenu : user?.role === 'partner' ? partnerMenu : customerMenu;

  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-md shadow-primary-dark/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/feed" className="font-display text-2xl font-extrabold text-tmain">
              #ChillGo
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {menu.map((item) => {
                const active = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-primary-dark text-tmain' : 'text-tmain hover:bg-primary-dark/50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/notifications"
                  className="relative w-9 h-9 rounded-lg bg-white/60 hover:bg-white/80 flex items-center justify-center transition"
                >
                  <Bell size={18} className="text-tmain" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full text-[10px] font-bold text-primary-light flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white/80 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-tmain font-bold text-sm">
                    {user.full_name?.charAt(0) || '?'}
                  </div>
                  <span className="text-sm font-medium text-tmain hidden sm:inline">{user.full_name}</span>
                  <ChevronDown size={14} className="text-tmain" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-primary-dark/20 shadow-lg py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-primary-dark/10">
                      <p className="text-sm font-medium text-tmain">{user.full_name}</p>
                      <p className="text-xs text-tmuted">{user.email}</p>
                      <span className="inline-block mt-1 text-xs bg-primary-light text-primary-text px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                    </div>
                    <Link
                      href="/dashboard/customer"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-tmain hover:bg-primary-light transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={16} /> โปรไฟล์
                    </Link>
                    <Link
                      href="/booking"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-tmain hover:bg-primary-light transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      <CalendarCheck size={16} /> การจองของฉัน
                    </Link>
                    <Link
                      href="/chat"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-tmain hover:bg-primary-light transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      <MessageCircle size={16} /> ข้อความ
                    </Link>
                    <div className="border-t border-primary-dark/10 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-tmain hover:bg-danger/10 transition w-full text-left"
                      >
                        <LogOut size={16} /> ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-tmain hover:bg-primary-dark/50 rounded-lg transition">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold bg-secondary text-tmain rounded-lg hover:bg-secondary/90 transition">
                  สมัครสมาชิก
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center text-tmain"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            {menu.map((item) => {
              const active = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-primary-dark text-tmain' : 'text-tmain hover:bg-primary-dark/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
