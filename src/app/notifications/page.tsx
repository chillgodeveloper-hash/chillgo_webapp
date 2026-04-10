'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { Bell, CreditCard, MessageCircle, CalendarCheck, Settings, Check } from 'lucide-react';
import { Notification } from '@/types';
import Link from 'next/link';

const typeIcons: Record<string, any> = {
  booking: CalendarCheck,
  chat: MessageCircle,
  payment: CreditCard,
  system: Settings,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 animate-blur-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-tmain">การแจ้งเตือน</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-tmuted">{unreadCount} รายการยังไม่ได้อ่าน</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-sm text-tmuted hover:bg-primary/20 px-3 py-1.5 rounded-lg transition"
            >
              <Check size={16} /> อ่านทั้งหมด
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20" />
                  <div className="flex-1 space-y-2">
                    <div className="w-1/2 h-4 bg-primary/20 rounded" />
                    <div className="w-3/4 h-3 bg-primary/20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-primary-dark/20">
            <Bell size={48} className="text-primary mx-auto mb-4" />
            <p className="text-tmain font-medium">ยังไม่มีการแจ้งเตือน</p>
            <p className="text-sm text-tmuted mt-1">เมื่อมีกิจกรรมใหม่ จะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Bell;
              return (
                <Link
                  key={notif.id}
                  href={notif.link || '#'}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`block rounded-xl p-4 border transition-colors ${
                    notif.is_read
                      ? 'bg-white border-primary-dark/10'
                      : 'bg-primary-light border-primary-dark/20'
                  } hover:border-primary`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'payment' ? 'bg-success/20' :
                      notif.type === 'booking' ? 'bg-primary/30' :
                      notif.type === 'chat' ? 'bg-info/20' :
                      'bg-primary/20'
                    }`}>
                      <Icon size={18} className="text-tmain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-tmain">{notif.title}</p>
                        {!notif.is_read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-tmuted mt-0.5">{notif.message}</p>
                      <p className="text-xs text-tmuted mt-1">
                        {new Date(notif.created_at).toLocaleDateString('th-TH')} {new Date(notif.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
