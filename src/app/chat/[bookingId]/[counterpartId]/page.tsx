'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { checkContentViolation } from '@/lib/moderation';
import AppLayout from '@/components/layout/AppLayout';
import { Send, ImagePlus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { ChatMessage, Profile } from '@/types';
import Link from 'next/link';

export default function ChatRoomPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const counterpartId = params.counterpartId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [counterpart, setCounterpart] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [violation, setViolation] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!bookingId || !counterpartId || !user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setup = async () => {
      // Push the JWT into the realtime client (see prior fix) so the channel
      // joins authenticated and RLS lets events through.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      const [{ data: msgs }, { data: cp }] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('*, sender:profiles!sender_id(*)')
          .eq('booking_id', bookingId)
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${counterpartId}),` +
            `and(sender_id.eq.${counterpartId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('id', counterpartId).single(),
      ]);

      if (cancelled) return;
      setMessages(msgs || []);
      setCounterpart(cp || null);

      channel = supabase
        .channel(`chat:${bookingId}:${user.id}:${counterpartId}:${Math.random().toString(36).slice(2, 8)}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `booking_id=eq.${bookingId}`,
          },
          async (payload) => {
            // postgres_changes filter is single-column; gate the room pair here.
            const m = payload.new as any;
            const inThisRoom =
              (m.sender_id === user.id && m.receiver_id === counterpartId) ||
              (m.sender_id === counterpartId && m.receiver_id === user.id);
            if (!inThisRoom) return;

            const { data } = await supabase
              .from('chat_messages')
              .select('*, sender:profiles!sender_id(*)')
              .eq('id', m.id)
              .single();
            if (data) {
              setMessages((prev) => prev.some((x) => x.id === data.id) ? prev : [...prev, data]);
            }
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      cancelled = true;
      setTimeout(() => { if (channel) supabase.removeChannel(channel); }, 0);
    };
  }, [bookingId, counterpartId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !bookingId || !counterpartId) return;

    const check = checkContentViolation(newMessage);
    if (check.isViolation) {
      setViolation(check.reason || '');
      return;
    }

    setSending(true);
    const { data: inserted, error } = await supabase
      .from('chat_messages')
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        receiver_id: counterpartId,
        message: newMessage.trim(),
      })
      .select('*, sender:profiles!sender_id(*)')
      .single();

    if (error) {
      setViolation('ส่งข้อความไม่สำเร็จ: ' + error.message);
      setSending(false);
      return;
    }

    if (inserted) {
      setMessages((prev) => prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted]);
    }

    setNewMessage('');
    setViolation('');
    setSending(false);
  };

  const counterpartLabel = counterpart?.full_name
    || (counterpart?.role === 'admin' ? 'แอดมิน' : 'ผู้ใช้');
  const counterpartInitial = counterpartLabel.charAt(0) || '?';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] animate-blur-in lg:h-[calc(100vh-6rem)]">
        <div className="bg-white rounded-t-2xl border border-primary-dark/20 p-4 flex items-center gap-3">
          <Link href="/chat" className="text-tmuted hover:text-tmuted lg:hidden">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm">
            {counterpartInitial}
          </div>
          <div>
            <p className="font-semibold text-sm text-tmain">{counterpartLabel}</p>
            <p className="text-xs text-tmuted">การจอง #{String(bookingId).slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-primary-light p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-tmuted text-sm">เริ่มต้นสนทนา</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'order-1' : 'order-2'}`}>
                  {!isMe && (
                    <p className="text-xs text-tmuted mb-1 ml-1">{msg.sender?.full_name}</p>
                  )}
                  <div className={`w-fit px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    isMe
                      ? 'ml-auto bg-primary text-dark-DEFAULT rounded-br-md'
                      : 'bg-white text-tmain border border-primary-dark/20 rounded-bl-md'
                  }`}>
                    {msg.message}
                  </div>
                  <p className={`text-[10px] text-tmuted mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex flex-col">
          {violation && (
            <div className="bg-danger/10 border-t border-danger/20 px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={14} className="text-danger mt-0.5 flex-shrink-0" />
              <p className="text-xs text-tmain">{violation}</p>
            </div>
          )}
          <form onSubmit={handleSend} className="bg-white border-t border-primary-dark/15 p-3 rounded-b-2xl flex items-center gap-2">
            <button type="button" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-tmuted hover:bg-primary-dark/30 transition flex-shrink-0">
              <ImagePlus size={18} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                const c = checkContentViolation(e.target.value);
                setViolation(c.isViolation ? (c.reason || '') : '');
              }}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 px-4 py-2.5 rounded-full bg-primary/20 outline-none text-sm focus:bg-primary-light focus:ring-2 focus:ring-primary/20 transition"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !!violation}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-dark-DEFAULT hover:bg-primary-dark transition disabled:opacity-40 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
