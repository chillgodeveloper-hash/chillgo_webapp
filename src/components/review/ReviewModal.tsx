'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Star, X, Send } from 'lucide-react';

interface ReviewModalProps {
  bookingId: string;
  partnerId: string;
  partnerName: string;
  postTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ bookingId, partnerId, partnerName, postTitle, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthStore();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setLoading(true);

    await supabase.from('reviews').insert({
      booking_id: bookingId,
      customer_id: user.id,
      partner_id: partnerId,
      rating,
      comment: comment.trim() || null,
    });

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('partner_id', partnerId);

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
      await supabase
        .from('partner_profiles')
        .update({ rating: Math.round(avgRating * 10) / 10, total_reviews: reviews.length })
        .eq('user_id', partnerId);
    }

    await supabase.from('notifications').insert({
      user_id: partnerId,
      title: 'ได้รับรีวิวใหม่',
      message: `${user.full_name} ให้คะแนน ${rating} ดาว สำหรับ "${postTitle}"`,
      type: 'system',
      link: '/dashboard/partner',
    });

    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl overflow-hidden animate-slide-up mx-4">
        <div className="p-4 border-b border-primary-dark/15 flex items-center justify-between">
          <h2 className="font-bold text-lg text-tmain">รีวิวบริการ</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-tmain hover:bg-primary/30 transition">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-tmain mb-2">ขอบคุณสำหรับรีวิว!</h3>
            <p className="text-sm text-tmuted">รีวิวของคุณจะช่วยพัฒนาบริการให้ดียิ่งขึ้น</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-sm text-tmuted mb-1">ให้คะแนน</p>
              <p className="font-semibold text-tmain">{partnerName}</p>
              <p className="text-sm text-tmuted">{postTitle}</p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-primary-dark/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-tmuted">
              {rating === 0 ? 'กดดาวเพื่อให้คะแนน' :
               rating === 1 ? 'แย่' :
               rating === 2 ? 'พอใช้' :
               rating === 3 ? 'ปานกลาง' :
               rating === 4 ? 'ดี' : 'ยอดเยี่ยม'}
            </p>

            <div>
              <label className="text-sm font-medium text-tmain mb-1 block">ความคิดเห็น (ไม่บังคับ)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="เล่าประสบการณ์ของคุณ..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="w-full bg-primary hover:bg-primary-dark text-tmain font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" />
              ) : (
                <><Send size={18} /> ส่งรีวิว</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
