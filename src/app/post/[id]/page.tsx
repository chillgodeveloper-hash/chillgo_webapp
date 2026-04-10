'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import BookingModal from '@/components/booking/BookingModal';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Star, ChevronLeft, ChevronRight, Share2, Globe } from 'lucide-react';

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      const { data } = await supabase.from('posts').select('*').eq('id', id).single();
      if (data) {
        setPost(data);
        const { data: pp } = await supabase.from('partner_profiles').select('*').eq('id', data.partner_id).single();
        if (pp) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', pp.user_id).single();
          setPartner({ ...pp, profile });
        }

        const { data: related } = await supabase
          .from('posts')
          .select('*, partner_profile:partner_profiles(*, profile:profiles(*))')
          .eq('category', data.category)
          .eq('status', 'active')
          .neq('id', data.id)
          .limit(4);
        setRelatedPosts(related || []);
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 animate-pulse space-y-4">
            <div className="w-2/3 h-6 bg-primary/20 rounded" />
            <div className="w-full h-64 bg-primary/20 rounded-xl" />
            <div className="w-1/2 h-4 bg-primary/20 rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-tmain font-medium">ไม่พบโพสต์</p>
          <Link href="/feed" className="text-secondary font-medium mt-2 inline-block">กลับหน้าหลัก</Link>
        </div>
      </AppLayout>
    );
  }

  const images = (post.media_urls || []).filter((_: string, i: number) => post.media_types?.[i] === 'image');
  const videos = (post.media_urls || []).filter((_: string, i: number) => post.media_types?.[i] === 'video');
  const categoryLabel = post.category === 'guide' ? '🗺️ ไกด์' : post.category === 'driver' ? '🚗 คนขับรถ' : '🌐 ล่าม';

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8 animate-blur-in">
        <Link href="/feed" className="flex items-center gap-1 text-tmuted mb-4 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition w-fit">
          <ArrowLeft size={18} /> กลับหน้าหลัก
        </Link>

        <div className="space-y-4">
          {(images.length > 0 || videos.length > 0) && (
            <div className="relative aspect-[16/9] bg-primary/10 rounded-2xl overflow-hidden">
              {images.length > 0 && (
                <>
                  <img src={images[currentImage]} alt={post.title} className="w-full h-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImage(p => Math.max(0, p - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"><ChevronLeft size={22} /></button>
                      <button onClick={() => setCurrentImage(p => Math.min(images.length - 1, p + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"><ChevronRight size={22} /></button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_: string, i: number) => (
                          <button key={i} onClick={() => setCurrentImage(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === currentImage ? 'bg-white scale-110' : 'bg-white/40'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {videos.length > 0 && images.length === 0 && (
                <video src={videos[0]} controls className="w-full h-full object-cover" />
              )}
            </div>
          )}

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url: string, i: number) => (
                <button key={i} onClick={() => setCurrentImage(i)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${i === currentImage ? 'border-secondary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-primary-dark/20 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs bg-secondary/10 text-secondary px-2.5 py-1 rounded-full font-medium">{categoryLabel}</span>
                <h1 className="text-2xl font-bold text-tmain mt-2">{post.title}</h1>
              </div>
              {(post.price_min || post.price_max) && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-secondary">฿{post.price_min?.toLocaleString()}</p>
                  {post.price_max && post.price_max !== post.price_min && <p className="text-xs text-tmuted">- ฿{post.price_max.toLocaleString()}</p>}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.location && (
                <span className="flex items-center gap-1 text-sm text-tmuted bg-primary-light px-3 py-1 rounded-full"><MapPin size={14} /> {post.location}</span>
              )}
              <span className="flex items-center gap-1 text-sm text-tmuted bg-primary-light px-3 py-1 rounded-full"><Globe size={14} /> ตลอดทั้งปี</span>
            </div>

            <div className="flex items-center gap-2 mb-4 bg-amber-50 rounded-xl px-4 py-2.5">
              <Star size={18} className="text-amber-500 fill-amber-500" />
              {partner?.rating > 0 ? (
                <>
                  <span className="text-lg font-bold text-amber-700">{partner.rating.toFixed(1)}</span>
                  <span className="text-sm text-amber-600">({partner.total_reviews} รีวิว)</span>
                </>
              ) : (
                <span className="text-sm text-amber-600">ยังไม่มีรีวิว</span>
              )}
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-tmuted leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            <div className="flex items-center gap-4 pt-4 mt-4 border-t border-primary-dark/10">
              <button onClick={() => { if (navigator.share) { navigator.share({ title: post.title, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }} className="flex items-center gap-1.5 text-sm text-tmuted hover:text-secondary transition">
                <Share2 size={20} /> แชร์
              </button>
            </div>
          </div>

          {partner && (
            <Link href={`/partner/${partner.user_id}`} className="block bg-white rounded-2xl border border-primary-dark/20 p-5 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {partner.profile?.avatar_url ? (
                    <img src={partner.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-text font-bold text-xl">{partner.profile?.full_name?.charAt(0) || 'P'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-tmain">{partner.business_name}</p>
                  <p className="text-sm text-tmuted">{partner.profile?.full_name}</p>
                  {partner.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium">{partner.rating.toFixed(1)}</span>
                      <span className="text-xs text-tmuted">({partner.total_reviews} รีวิว)</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-secondary font-medium">ดูโปรไฟล์ →</span>
              </div>
            </Link>
          )}

          {user?.role === 'customer' && (
            <button
              onClick={() => setShowBooking(true)}
              className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-4 rounded-2xl text-lg transition shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
            >
              จองเลย
            </button>
          )}

          <div className="mt-6">
            <h2 className="font-bold text-lg text-tmain mb-4">โพสต์อื่นที่เกี่ยวข้อง</h2>
            {relatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedPosts.map((rp: any) => {
                  const rpImage = rp.media_urls?.[0];
                  const rpPartner = rp.partner_profile;
                  return (
                    <Link key={rp.id} href={`/post/${rp.id}`} className="bg-white rounded-xl border border-primary-dark/20 overflow-hidden hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <div className="relative h-32">
                        {rpImage ? (
                          <Image src={rpImage} alt={rp.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl">
                            {rp.category === 'guide' ? '🗺️' : rp.category === 'driver' ? '🚗' : '🌐'}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-tmain text-sm line-clamp-1">{rp.title}</h3>
                        <p className="text-xs text-tmuted mt-0.5">{rpPartner?.business_name}</p>
                        <div className="flex items-center justify-between mt-2">
                          {rp.price_min && <span className="text-sm font-bold text-secondary">฿{rp.price_min.toLocaleString()}</span>}
                          <span className="flex items-center gap-0.5 text-xs text-amber-600">
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                            {rpPartner?.rating > 0 ? rpPartner.rating.toFixed(1) : '-'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-primary-dark/20 p-6 text-center">
                <p className="text-tmuted text-sm">ยังไม่มีโพสต์ที่เกี่ยวข้องในขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBooking && post && (
        <BookingModal post={post} onClose={() => setShowBooking(false)} />
      )}
    </AppLayout>
  );
}
