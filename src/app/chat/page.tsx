'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function ChatListPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`
          id, status,
          post:posts(title),
          partner:partner_profiles(*, profile:profiles(*)),
          customer:profiles!bookings_customer_id_fkey(*)
        `)
        .or(`customer_id.eq.${user.id},partner_id.eq.${user.id}`)
        .in('status', ['confirmed', 'paid', 'in_progress'])
        .order('updated_at', { ascending: false });

      setChats(data || []);
      setLoading(false);
    };
    fetchChats();
  }, [user]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 lg:px-0">
        <h1 className="text-2xl font-bold text-tmain mb-4 hidden lg:block">ข้อความ</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-dark/30" />
                  <div className="space-y-2 flex-1">
                    <div className="w-1/2 h-4 bg-primary-dark/30 rounded" />
                    <div className="w-1/3 h-3 bg-primary-dark/30 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-tmuted">ยังไม่มีข้อความ</p>
            <p className="text-tmuted text-sm mt-1">เริ่มแชทหลังจากยืนยันการจอง</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => {
              const otherPerson = user?.role === 'customer'
                ? chat.partner?.profile?.full_name
                : chat.customer?.full_name;

              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-primary-dark/20 hover:border-primary/30 hover:shadow-sm transition"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold">
                    {otherPerson?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-tmain truncate">{otherPerson}</p>
                    <p className="text-sm text-tmuted truncate">{chat.post?.title}</p>
                  </div>
                  <MessageCircle size={18} className="text-tmuted flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
