'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import PostCard from '@/components/feed/PostCard';
import CreatePostForm from '@/components/feed/CreatePostForm';
import BookingModal from '@/components/booking/BookingModal';
import { Search, SlidersHorizontal, Map, Car } from 'lucide-react';
import { Post } from '@/types';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [bookingPost, setBookingPost] = useState<Post | null>(null);
  const { user } = useAuthStore();
  const supabase = createClient();

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select(`
        *,
        partner_profile:partner_profiles(
          *,
          profile:profiles(*)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 lg:px-0">
        <div className="sticky top-14 lg:top-0 z-30 bg-gray-50 pt-4 pb-3">
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาไกด์ รถเช่า สถานที่..."
              className="w-full pl-11 pr-12 py-3 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary-dark hover:bg-primary/20 transition"
            >
              <SlidersHorizontal size={16} />
            </button>
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => setCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                category === 'all'
                  ? 'bg-dark-DEFAULT text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setCategory('guide')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                category === 'guide'
                  ? 'bg-secondary text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Map size={14} /> ไกด์
            </button>
            <button
              onClick={() => setCategory('car_rental')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                category === 'car_rental'
                  ? 'bg-info text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Car size={14} /> รถเช่า
            </button>
          </div>
        </div>

        <div className="space-y-4 mt-2">
          {user?.role === 'partner' && (
            <CreatePostForm onSuccess={fetchPosts} />
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gray-200" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded" />
                      <div className="w-20 h-3 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-4" />
                  <div className="space-y-2">
                    <div className="w-3/4 h-4 bg-gray-200 rounded" />
                    <div className="w-1/2 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">🏖️</p>
              <p className="text-gray-500 font-medium">ยังไม่มีโพสต์ในขณะนี้</p>
              <p className="text-gray-400 text-sm mt-1">ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onBook={setBookingPost}
              />
            ))
          )}
        </div>
      </div>

      {bookingPost && (
        <BookingModal
          post={bookingPost}
          onClose={() => setBookingPost(null)}
        />
      )}
    </AppLayout>
  );
}
