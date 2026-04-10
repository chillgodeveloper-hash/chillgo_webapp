'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onBook?: (post: Post) => void;
}

export default function PostCard({ post, onBook }: PostCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);

  const partner = post.partner_profile;
  const images = post.media_urls.filter((_, i) => post.media_types[i] === 'image');
  const videos = post.media_urls.filter((_, i) => post.media_types[i] === 'video');

  const categoryLabel = post.category === 'guide' ? '🗺️ ไกด์' : post?.category === 'driver' ? '🚗 คนขับรถ' : '🌐 ล่าม';
  const categoryColor = post.category === 'guide' ? 'bg-secondary/10 text-secondary' : 'bg-info/10 text-info';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-primary/15 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3 p-4">
        <Link href={`/partner/${partner?.user_id}`} className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-secondary transition">
          {partner?.profile?.avatar_url ? (
            <img src={partner.profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            partner?.profile?.full_name?.charAt(0) || 'P'
          )}
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/partner/${partner?.user_id}`} className="font-semibold text-tmain text-sm hover:text-secondary transition">{partner?.business_name}</Link>
            {partner?.is_verified && (
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">✓</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-tmuted">
            <span className={`${categoryColor} px-2 py-0.5 rounded-full font-medium`}>{categoryLabel}</span>
            {post.location && (
              <span className="flex items-center gap-0.5">
                <MapPin size={10} /> {post.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <Link href={`/post/${post.id}`}>
        {(images.length > 0 || videos.length > 0) && (
          <div className="relative aspect-[4/3] bg-primary/20">
            {images.length > 0 && (
              <>
                <Image
                  src={images[currentImage]}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); setCurrentImage((p) => Math.max(0, p - 1)); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-light"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setCurrentImage((p) => Math.min(images.length - 1, p + 1)); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-light"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <span key={i} className={`w-2 h-2 rounded-full transition ${i === currentImage ? 'bg-white' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {videos.length > 0 && images.length === 0 && (
              <video src={videos[0]} controls className="w-full h-full object-cover" onClick={(e) => e.preventDefault()} />
            )}
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={`/post/${post.id}`}>
          <h3 className="font-bold text-tmain mb-1 hover:text-secondary transition">{post.title}</h3>
          <p className="text-sm text-tmuted line-clamp-3 mb-3">{post.content}</p>
        </Link>

        {(post.price_min || post.price_max) && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-lg font-bold text-secondary">
              ฿{post.price_min?.toLocaleString()}
              {post.price_max && post.price_max !== post.price_min && ` - ฿${post.price_max.toLocaleString()}`}
            </span>
          </div>
        )}

        {partner?.rating !== undefined && partner.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium">{partner.rating.toFixed(1)}</span>
            <span className="text-xs text-tmuted">({partner.total_reviews} รีวิว)</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-primary-dark/15">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 text-sm transition ${liked ? 'text-danger' : 'text-tmuted hover:bg-danger/10'}`}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button className="flex items-center gap-1.5 text-sm text-tmuted hover:text-tmuted transition">
              <MessageCircle size={20} />
            </button>
            <button className="flex items-center gap-1.5 text-sm text-tmuted hover:text-tmuted transition">
              <Share2 size={20} />
            </button>
          </div>

          <button
            onClick={() => onBook?.(post)}
            className="bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold px-5 py-2 rounded-xl text-sm transition shadow-sm hover:shadow-md active:scale-95"
          >
            จองเลย
          </button>
        </div>
      </div>
    </div>
  );
}
