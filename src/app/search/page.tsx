'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import SearchHero from '@/components/feed/SearchHero';
import PostListItem from '@/components/feed/PostListItem';
import BookingModal from '@/components/booking/BookingModal';
import Footer from '@/components/layout/Footer';
import { Post } from '@/types';
import { ArrowUpDown } from 'lucide-react';
import SearchFilter, { defaultFilters } from '@/components/feed/SearchFilter';

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user } = useAuth();

  const initialParams = {
    category: searchParams.get('cat') || '',
    location: searchParams.get('loc') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
  };

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingPost, setBookingPost] = useState<Post | null>(null);
  const [activeParams, setActiveParams] = useState(initialParams);
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'rating'>('newest');
  const [filters, setFilters] = useState(defaultFilters);

  const handleBook = (post: Post) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setBookingPost(post);
  };

  const fetchPosts = async (params: typeof initialParams) => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select(`*, partner_profile:partner_profiles(*, profile:profiles(*))`)
      .eq('status', 'active');

    const cat = filters.category || params.category;
    if (cat) query = query.eq('category', cat);

    const loc = filters.location || params.location;
    if (loc) query = query.or(`title.ilike.%${loc}%,content.ilike.%${loc}%,location.ilike.%${loc}%`);

    if (filters.priceMin) query = query.gte('price_min', parseFloat(filters.priceMin));
    if (filters.priceMax) query = query.lte('price_max', parseFloat(filters.priceMax));

    if (sortBy === 'price_low') query = query.order('price_min', { ascending: true, nullsFirst: false });
    else if (sortBy === 'price_high') query = query.order('price_min', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query;
    let filtered = data || [];

    if (filters.rating > 0) filtered = filtered.filter((p: any) => p.partner_profile?.rating >= filters.rating);
    if (filters.verified) filtered = filtered.filter((p: any) => p.partner_profile?.is_verified);

    if (params.date) {
      filtered = filtered.filter((p: any) => {
        if (!p.available_start) return true;
        const searchDate = new Date(params.date);
        const start = new Date(p.available_start);
        const end = p.available_end ? new Date(p.available_end) : start;
        return searchDate >= start && searchDate <= end;
      });
    }

    setPosts(filtered);
    setLoading(false);
  };

  // Re-search from the compact SearchHero — bump the URL so refreshing / sharing keeps the query.
  const handleSearch = (params: typeof initialParams) => {
    setActiveParams(params);
    const qs = new URLSearchParams();
    if (params.category) qs.set('cat', params.category);
    if (params.location) qs.set('loc', params.location);
    if (params.date) qs.set('date', params.date);
    if (params.time) qs.set('time', params.time);
    router.replace(`/search?${qs.toString()}`);
    fetchPosts(params);
  };

  useEffect(() => {
    fetchPosts(activeParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, filters]);

  useEffect(() => {
    fetchPosts(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <SearchHero onSearch={handleSearch} compact />

        <div className="flex gap-6 mt-6">
          <SearchFilter
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(defaultFilters)}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-tmuted">
                {loading ? 'กำลังค้นหา...' : `พบ ${posts.length} รายการ`}
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-tmuted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-sm text-tmain bg-white border border-primary-dark/30 rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                >
                  <option value="newest">ใหม่ล่าสุด</option>
                  <option value="price_low">ราคาต่ำ → สูง</option>
                  <option value="price_high">ราคาสูง → ต่ำ</option>
                  <option value="rating">คะแนนสูงสุด</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-4">
                    <div className="w-64 h-40 bg-primary/20 rounded-xl flex-shrink-0 hidden md:block" />
                    <div className="flex-1 space-y-3">
                      <div className="w-2/3 h-5 bg-primary/20 rounded" />
                      <div className="w-1/3 h-4 bg-primary/20 rounded" />
                      <div className="w-full h-4 bg-primary/20 rounded" />
                      <div className="w-1/4 h-6 bg-primary/20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-primary-dark/20">
                <p className="text-5xl mb-4">🏖️</p>
                <p className="text-tmain font-medium text-lg">ไม่พบผลลัพธ์</p>
                <p className="text-tmuted text-sm mt-1">ลองค้นหาด้วยคำอื่น หรือเปลี่ยนเงื่อนไข</p>
                <button
                  onClick={() => router.push('/feed')}
                  className="mt-4 bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2 rounded-xl transition"
                >
                  กลับหน้าหลัก
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostListItem key={post.id} post={post} onBook={handleBook} />
                ))}
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={() => router.push('/feed')}
                className="text-sm text-tmuted hover:bg-primary/20 px-4 py-2 rounded-lg transition"
              >
                ← กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {bookingPost && (
        <BookingModal post={bookingPost} onClose={() => setBookingPost(null)} />
      )}
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}
