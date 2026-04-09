'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { LogOut, ChevronDown, User, CalendarCheck, MessageCircle, Tag, LayoutDashboard, Bell, CreditCard, Settings, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, partnerProfile } = useAuthStore();
  const supabase = createClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setUnreadCount((prev) => prev + 1);
        setNotifications((prev) => [payload.new as any, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const openNotifDropdown = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && user) {
      setNotifLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data || []);
      setNotifLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const notifIcon = (type: string) => {
    if (type === 'payment') return CreditCard;
    if (type === 'booking') return CalendarCheck;
    if (type === 'chat') return MessageCircle;
    return Bell;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  const customerMenu = [
    { href: '/feed', label: 'หน้าหลัก' },
    { href: '/flights', label: 'เที่ยวบิน' },
    { href: '/hotels', label: 'โรงแรม' },
    { href: '/booking', label: 'การจอง' },
    { href: '/chat', label: 'ข้อความ' },
  ];

  const partnerMenu = [
    { href: '/feed', label: 'หน้าหลัก' },
    { href: '/dashboard/partner', label: 'จัดการโพสต์' },
    { href: '/booking', label: 'การจอง' },
    { href: '/chat', label: 'ข้อความ' },
  ];

  const adminMenu = [
    { href: '/feed', label: 'หน้าหลัก' },
    { href: '/dashboard/admin/bookings', label: 'การจอง' },
    { href: '/dashboard/admin/partners', label: 'พาร์ทเนอร์' },
    { href: '/chat', label: 'แชท' },
    { href: '/dashboard/admin/reports/revenue', label: 'รายงาน' },
  ];

  const menu = user?.role === 'admin' ? adminMenu : user?.role === 'partner' ? partnerMenu : customerMenu;

  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-md shadow-primary-dark/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/feed" className="flex items-center">
              <img src="/logo.png" alt="ChillGo" className="h-10 w-auto" />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {menu.map((item) => {
                const active = pathname === item.href || (
                  item.href !== '/feed' &&
                  item.href !== '/dashboard/admin' &&
                  item.href !== '/dashboard/partner' &&
                  pathname.startsWith(item.href)
                );
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
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={openNotifDropdown}
                    className="relative w-9 h-9 rounded-lg bg-white/60 hover:bg-white/80 flex items-center justify-center transition"
                  >
                    <Bell size={18} className="text-tmain" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full text-[10px] font-bold text-primary-light flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-primary-dark/20 shadow-xl animate-fade-in z-50 max-h-[70vh] flex flex-col">
                      <div className="px-4 py-3 border-b border-primary-dark/10 flex items-center justify-between flex-shrink-0">
                        <h3 className="font-bold text-tmain text-sm">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-tmuted hover:bg-primary/20 px-2 py-1 rounded-lg transition flex items-center gap-1">
                            <Check size={12} /> อ่านทั้งหมด
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto flex-1">
                        {notifLoading ? (
                          <div className="p-6 text-center">
                            <div className="w-6 h-6 border-2 border-primary-dark/30 border-t-secondary rounded-full animate-spin mx-auto" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell size={32} className="text-primary mx-auto mb-2" />
                            <p className="text-sm text-tmuted">ยังไม่มีการแจ้งเตือน</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const Icon = notifIcon(notif.type);
                            const timeAgo = getTimeAgo(notif.created_at);
                            return (
                              <button
                                key={notif.id}
                                onClick={() => {
                                  if (!notif.is_read) markAsRead(notif.id);
                                  if (notif.link) { router.push(notif.link); setNotifOpen(false); }
                                }}
                                className={`w-full text-left px-4 py-3 border-b border-primary-dark/5 hover:bg-primary-light/50 transition flex gap-3 ${
                                  !notif.is_read ? 'bg-primary-light/30' : ''
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notif.type === 'payment' ? 'bg-success/20' :
                                  notif.type === 'booking' ? 'bg-primary/30' :
                                  'bg-info/20'
                                }`}>
                                  <Icon size={16} className="text-tmain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-tmain truncate">{notif.title}</p>
                                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-1.5" />}
                                  </div>
                                  <p className="text-xs text-tmuted line-clamp-2">{notif.message}</p>
                                  <p className="text-[10px] text-tmuted mt-0.5">{timeAgo}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-primary-dark/10 flex-shrink-0">
                          <Link
                            href="/notifications"
                            onClick={() => setNotifOpen(false)}
                            className="block text-center text-xs text-tmuted hover:bg-primary/20 py-1.5 rounded-lg transition"
                          >
                            ดูทั้งหมด
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                      {user.role === 'partner' && partnerProfile?.category && (
                        <span className="inline-block mt-1 ml-1 text-xs bg-secondary/20 text-tmain px-2 py-0.5 rounded-full">
                          {partnerProfile.category === 'guide' ? 'ไกด์' : partnerProfile.category === 'driver' ? 'คนขับรถ' : 'ล่าม'}
                        </span>
                      )}
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
