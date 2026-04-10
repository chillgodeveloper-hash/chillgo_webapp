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
      let bookingIds: string[] = [];

      if (user.role === 'admin') {
        const { data: msgData } = await supabase
          .from('chat_messages')
          .select('booking_id')
          .eq('sender_id', user.id);
        bookingIds = Array.from(new Set((msgData || []).map((m: any) => m.booking_id)));

        if (bookingIds.length === 0) {
          setChats([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from('bookings')
        .select(`id, status, customer_id, partner_id, updated_at, post:posts!bookings_post_id_fkey(title)`)
        .in('status', ['confirmed', 'paid', 'in_progress'])
        .order('updated_at', { ascending: false });

      if (user.role === 'admin') {
        query = query.in('id', bookingIds);
      } else {
        query = query.or(`customer_id.eq.${user.id},partner_id.eq.${user.id}`);
      }

      const { data } = await query;

      const userIds = Array.from(new Set((data || []).flatMap((b: any) => [b.customer_id, b.partner_id])));
      const profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);
        profilesData?.forEach((p: any) => { profileMap[p.id] = p; });
      }

      const bookingIdsAll = (data || []).map((b: any) => b.id);
      const lastMsgMap: Record<string, any> = {};
      if (bookingIdsAll.length > 0) {
        const { data: lastMsgs } = await supabase
          .from('chat_messages')
          .select('booking_id, message, created_at, sender_id')
          .in('booking_id', bookingIdsAll)
          .order('created_at', { ascending: false });

        (lastMsgs || []).forEach((m: any) => {
          if (!lastMsgMap[m.booking_id]) {
            lastMsgMap[m.booking_id] = m;
          }
        });
      }

      const enriched = (data || []).map((b: any) => ({
        ...b,
        customer: profileMap[b.customer_id] || null,
        partner: profileMap[b.partner_id] || null,
        lastMessage: lastMsgMap[b.id] || null,
      }));

      enriched.sort((a: any, b: any) => {
        const aTime = a.lastMessage?.created_at || a.updated_at;
        const bTime = b.lastMessage?.created_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setChats(enriched);
      setLoading(false);
    };

    fetchChats();
  }, [user]);

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 lg:px-0 py-6 animate-blur-in lg:py-8">
        <h1 className="text-2xl font-bold text-tmain mb-4 hidden lg:block">
          {user?.role === 'admin' ? 'ประวัติแชท' : 'ข้อความ'}
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-dark/30" />
                  <div className="space-y-2 flex-1">
                    <div className="w-1/2 h-4 bg-primary-dark/30 rounded" />
                    <div className="w-2/3 h-3 bg-primary-dark/30 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-tmuted">
              {user?.role === 'admin' ? 'ยังไม่เคยส่งข้อความในแชทใด' : 'ยังไม่มีข้อความ'}
            </p>
            <p className="text-tmuted text-sm mt-1">
              {user?.role === 'admin'
                ? 'เริ่มแชทได้จากหน้ารายการจอง'
                : 'เริ่มแชทหลังจากยืนยันการจอง'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => {
              let displayName = '';
              if (user?.role === 'admin') {
                const cName = chat.customer?.full_name || 'ลูกค้า';
                const pName = chat.partner?.full_name || 'พาร์ทเนอร์';
                displayName = `${cName} ↔ ${pName}`;
              } else if (user?.role === 'customer') {
                displayName = chat.partner?.full_name || 'พาร์ทเนอร์';
              } else {
                displayName = chat.customer?.full_name || 'ลูกค้า';
              }

              const lastMsg = chat.lastMessage;
              let lastMsgPreview = chat.post?.title || '';
              if (lastMsg) {
                const senderName = lastMsg.sender_id === user?.id ? 'คุณ' : (
                  lastMsg.sender_id === chat.customer_id
                    ? (chat.customer?.full_name?.split(' ')[0] || '')
                    : (chat.partner?.full_name?.split(' ')[0] || '')
                );
                lastMsgPreview = `${senderName}: ${lastMsg.message}`;
              }

              const timeStr = lastMsg ? getTimeAgo(lastMsg.created_at) : '';

              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-primary-dark/20 hover:border-primary/30 hover:shadow-sm transition"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold flex-shrink-0">
                    {user?.role === 'admin' ? '👥' : (displayName?.charAt(0) || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-tmain truncate">{displayName}</p>
                      {timeStr && <p className="text-[11px] text-tmuted flex-shrink-0">{timeStr}</p>}
                    </div>
                    <p className="text-sm text-tmuted truncate">{lastMsgPreview}</p>
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
