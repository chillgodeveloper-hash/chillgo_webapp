'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Star, Heart, Calendar } from 'lucide-react';
import { Post } from '@/types';

interface PostListItemProps {
  post: Post;
  onBook?: (post: Post) => void;
}

export default function PostListItem({ post, onBook }: PostListItemProps) {
  const [liked, setLiked] = useState(false);
  const partner = post.partner_profile;
  const image = post.media_urls?.[0];
  const categoryLabel = post.category === 'guide' ? '🗺️ ไกด์' : post?.category === 'driver' ? '🚗 คนขับรถ' : '🌐 ล่าม';
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    router.push(`/post/${post.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row cursor-pointer"
    >
      <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
        {image ? (
          <Image src={image} alt={post.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-4xl">
            {post.category === 'guide' ? '🗺️' : post.category === 'driver' ? '🚗' : '🌐'}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center transition ${liked ? 'text-danger' : 'text-tmuted'}`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <span className="absolute top-3 left-3 bg-white/90 text-tmain text-xs font-medium px-2.5 py-1 rounded-full">
          {categoryLabel}
        </span>
      </div>

      <div className="flex-1 p-4 md:p-5 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-tmain text-lg leading-tight">{post.title}</h3>
            <p className="text-sm text-tmuted mt-0.5">
              <Link href={`/partner/${partner?.user_id}`} onClick={(e) => e.stopPropagation()} className="hover:text-secondary transition">{partner?.business_name}</Link>
            </p>
          </div>
          {partner?.is_verified && (
            <span className="text-xs bg-success/20 text-tmain px-2 py-0.5 rounded-full font-medium flex-shrink-0">✓ ยืนยัน</span>
          )}
        </div>

        <p className="text-sm text-tmuted line-clamp-2 mb-3 flex-1">{post.content}</p>

        <div className="flex flex-wrap items-center gap-3 text-sm text-tmuted mb-3">
          {post.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {post.location}
            </span>
          )}
          {partner?.rating !== undefined && partner.rating > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              {partner.rating.toFixed(1)} ({partner.total_reviews} รีวิว)
            </span>
          )}
          {(post as any).available_start && (post as any).available_end ? (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date((post as any).available_start).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              {' - '}
              {new Date((post as any).available_end).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-success/10 text-tmain px-2 py-0.5 rounded-full">
              ตลอดทั้งปี
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-primary-dark/10">
          <div>
            {post.price_min && (
              <span className="text-xl font-bold text-secondary">฿{post.price_min?.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onBook?.(post); }}
            className="bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm hover:shadow-md active:scale-95"
          >
            จองเลย
          </button>
        </div>
      </div>
    </div>
  );
}
