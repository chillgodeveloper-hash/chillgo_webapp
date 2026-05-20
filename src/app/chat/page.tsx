'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

interface Room {
  bookingId: string;
  counterpartId: string;
  bookingStatus: string;
  postTitle: string | null;
  counterpartName: string;
  counterpartRole: string | null;
  lastMessage: string;
  lastTime: string;
  lastSenderIsMe: boolean;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      // 1. All messages the current user is part of (sender or receiver).
      //    RLS already filters to messages they can see; admins see all.
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('booking_id, sender_id, receiver_id, message, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // 2. Group by (booking, counterpart) — take the first (most-recent) msg per room.
      const roomMap = new Map<string, {
        bookingId: string;
        counterpartId: string;
        lastMessage: string;
        lastTime: string;
        lastSenderIsMe: boolean;
      }>();
      for (const m of msgs || []) {
        const cp = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!cp) continue;
        const key = `${m.booking_id}:${cp}`;
        if (!roomMap.has(key)) {
          roomMap.set(key, {
            bookingId: m.booking_id,
            counterpartId: cp,
            lastMessage: m.message,
            lastTime: m.created_at,
            lastSenderIsMe: m.sender_id === user.id,
          });
        }
      }

      const roomList = Array.from(roomMap.values());

      // 3. Resolve booking + counterpart info.
      const bookingIds = Array.from(new Set(roomList.map((r) => r.bookingId)));
      const counterpartIds = Array.from(new Set(roomList.map((r) => r.counterpartId)));

      const [{ data: bookings }, { data: profiles }] = await Promise.all([
        bookingIds.length
          ? supabase
              .from('bookings')
              .select(`id, status, post:posts!bookings_post_id_fkey(title)`)
              .in('id', bookingIds)
          : Promise.resolve({ data: [] as any[] }),
        counterpartIds.length
          ? supabase.from('profiles').select('id, full_name, role').in('id', counterpartIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const bookingMap = new Map((bookings || []).map((b: any) => [b.id, b]));
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const enriched: Room[] = roomList
        .map((r) => {
          const b = bookingMap.get(r.bookingId) as any;
          const p = profileMap.get(r.counterpartId) as any;
          if (!b || !p) return null;
          return {
            bookingId: r.bookingId,
            counterpartId: r.counterpartId,
            bookingStatus: b.status,
            postTitle: b.post?.title || null,
            counterpartName: p.full_name || (p.role === 'admin' ? 'แอดมิน' : 'ผู้ใช้'),
            counterpartRole: p.role,
            lastMessage: r.lastMessage,
            lastTime: r.lastTime,
            lastSenderIsMe: r.lastSenderIsMe,
          };
        })
        .filter((x): x is Room => x !== null);

      setRooms(enriched);
      setLoading(false);
    };

    fetchRooms();
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

  const roleLabel = (role: string | null) => {
    if (role === 'admin') return 'Admin';
    if (role === 'partner') return 'Partner';
    if (role === 'customer') return 'Customer';
    return '';
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
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-tmuted">ยังไม่มีข้อความ</p>
            <p className="text-tmuted text-sm mt-1">เริ่มแชทจากหน้ารายการจอง</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => {
              const preview = `${room.lastSenderIsMe ? 'คุณ' : (room.counterpartName.split(' ')[0] || '')}: ${room.lastMessage}`;
              const role = roleLabel(room.counterpartRole);
              return (
                <Link
                  key={`${room.bookingId}:${room.counterpartId}`}
                  href={`/chat/${room.bookingId}/${room.counterpartId}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-primary-dark/20 hover:border-primary/30 hover:shadow-sm transition"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold flex-shrink-0">
                    {room.counterpartName.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-tmain truncate">
                        {room.counterpartName}
                        {role && <span className="ml-1 text-xs font-normal text-tmuted">({role})</span>}
                      </p>
                      <p className="text-[11px] text-tmuted flex-shrink-0">{getTimeAgo(room.lastTime)}</p>
                    </div>
                    {room.postTitle && (
                      <p className="text-[11px] text-tmuted truncate">การจอง: {room.postTitle}</p>
                    )}
                    <p className="text-sm text-tmuted truncate">{preview}</p>
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
