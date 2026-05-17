'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { checkContentViolation } from '@/lib/moderation';
import AppLayout from '@/components/layout/AppLayout';
import { Send, ImagePlus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '@/types';
import Link from 'next/link';

export default function ChatPage() {
  const { bookingId } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [violation, setViolation] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!bookingId || !user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setup = async () => {
      console.log('[chat] setup start, user=', user?.id, 'booking=', bookingId);
      // @supabase/ssr reads the session from cookies but does NOT push the
      // JWT into the realtime client — so the WS channel joins as anon and
      // RLS on chat_messages (bookings.customer_id = auth.uid()) drops every
      // event. Explicitly forward the token before subscribing.
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[chat] session?', !!session, 'token?', !!session?.access_token);
      if (cancelled) return;
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, sender:profiles(*)')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) console.error('[chat] fetch error:', error);
      console.log('[chat] fetched messages count=', data?.length || 0);
      setMessages(data || []);

      const channelName = `chat:${bookingId}:${user.id}:${Math.random().toString(36).slice(2, 8)}`;
      console.log('[chat] subscribing to', channelName);
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `booking_id=eq.${bookingId}`,
          },
          async (payload) => {
            console.log('[chat] received INSERT', payload.new);
            const { data } = await supabase
              .from('chat_messages')
              .select('*, sender:profiles(*)')
              .eq('id', payload.new.id)
              .single();
            if (data) {
              setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data]);
            }
          }
        )
        .subscribe((status, err) => {
          console.log('[chat] subscribe status:', status, err || '');
        });
    };

    setup();

    return () => {
      cancelled = true;
      // Defer removal so the WS finishes its join handshake before teardown —
      // silences the dev "WebSocket is closed before the connection is
      // established" warning that React Strict Mode triggers.
      setTimeout(() => { if (channel) supabase.removeChannel(channel); }, 0);
    };
  }, [bookingId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !bookingId) return;

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
        message: newMessage.trim(),
      })
      .select('*, sender:profiles(*)')
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] animate-blur-in lg:h-[calc(100vh-6rem)]">
        <div className="bg-white rounded-t-2xl border border-primary-dark/20 p-4 flex items-center gap-3">
          <Link href="/booking" className="text-tmuted hover:text-tmuted lg:hidden">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm">
            💬
          </div>
          <div>
            <p className="font-semibold text-sm text-tmain">ห้องแชทการจอง</p>
            <p className="text-xs text-tmuted">#{String(bookingId).slice(0, 8)}</p>
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
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-primary text-dark-DEFAULT rounded-br-md'
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
