'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { Send, ImagePlus, ArrowLeft } from 'lucide-react';
import { ChatMessage } from '@/types';
import Link from 'next/link';

export default function ChatPage() {
  const { bookingId } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!bookingId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, sender:profiles(*)')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*, sender:profiles(*)')
            .eq('id', payload.new.id)
            .single();
          if (data) setMessages((prev) => [...prev, data]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !bookingId) return;
    setSending(true);

    await supabase.from('chat_messages').insert({
      booking_id: bookingId,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    setNewMessage('');
    setSending(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
        <div className="bg-white rounded-t-2xl border border-gray-100 p-4 flex items-center gap-3">
          <Link href="/booking" className="text-gray-400 hover:text-gray-600 lg:hidden">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm">
            💬
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">ห้องแชทการจอง</p>
            <p className="text-xs text-gray-400">#{String(bookingId).slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-gray-400 text-sm">เริ่มต้นสนทนา</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'order-1' : 'order-2'}`}>
                  {!isMe && (
                    <p className="text-xs text-gray-400 mb-1 ml-1">{msg.sender?.full_name}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-primary text-dark-DEFAULT rounded-br-md'
                      : 'bg-white text-gray-700 border border-gray-100 rounded-bl-md'
                  }`}>
                    {msg.message}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="bg-white border-t border-gray-100 p-3 rounded-b-2xl flex items-center gap-2">
          <button type="button" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition flex-shrink-0">
            <ImagePlus size={18} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 outline-none text-sm focus:bg-gray-50 focus:ring-2 focus:ring-primary/20 transition"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-dark-DEFAULT hover:bg-primary-dark transition disabled:opacity-40 flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
