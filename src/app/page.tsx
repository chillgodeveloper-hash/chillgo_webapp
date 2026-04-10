'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bookingPost, setBookingPost] = useState<Post | null>(null);
  const [searchParams, setSearchParams] = useState({ category: '', location: '', date: '', time: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'rating'>('newest');
  const [filters, setFilters] = useState(defaultFilters);
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const handleBook = (post: Post) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setBookingPost(post);
  };

  const fetchPosts = async (params?: { category: string; location: string; date: string; time: string }) => {
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from('posts')
      .select(`
        *,
        partner_profile:partner_profiles(
          *,
          profile:profiles(*)
        )
      `)
      .eq('status', 'active');

    const cat = filters.category || params?.category;
    if (cat) {
      query = query.eq('category', cat);
    }

    const loc = filters.location || params?.location;
    if (loc) {
      query = query.or(`title.ilike.%${loc}%,content.ilike.%${loc}%,location.ilike.%${loc}%`);
    }

    if (filters.priceMin) {
      query = query.gte('price_min', parseFloat(filters.priceMin));
    }
    if (filters.priceMax) {
      query = query.lte('price_min', parseFloat(filters.priceMax));
    }

    if (sortBy === 'price_low') {
      query = query.order('price_min', { ascending: true, nullsFirst: false });
    } else if (sortBy === 'price_high') {
      query = query.order('price_min', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;

    let filtered = data || [];

    if (filters.rating > 0) {
      filtered = filtered.filter((p: any) => p.partner_profile?.rating >= filters.rating);
    }
    if (filters.verified) {
      filtered = filtered.filter((p: any) => p.partner_profile?.is_verified);
    }

    if (params?.date) {
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

  const handleSearch = (params: { category: string; location: string; date: string; time: string }) => {
    setSearchParams(params);
    fetchPosts(params);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
  };

  useEffect(() => {
    if (searched) {
      fetchPosts(searchParams);
    }
  }, [sortBy, filters]);

  return (
    <AppLayout>
      {!searched ? (
        <>
          <SearchHero onSearch={handleSearch} />

          <div className="max-w-7xl mx-auto px-4 py-12 animate-blur-in">
            <h2 className="font-display text-2xl font-bold text-tmain mb-6 text-center">บริการยอดนิยม</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                onClick={() => handleSearch({ category: 'guide', location: '', date: '', time: '' })}
                className="bg-white rounded-2xl border border-primary-dark/20 p-5 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-2">🗺️</div>
                <h3 className="font-bold text-tmain text-sm">ไกด์ท่องเที่ยว</h3>
                <p className="text-xs text-tmuted mt-1">ไกด์มืออาชีพพาเที่ยวทั่วไทย</p>
              </div>
              <div
                onClick={() => handleSearch({ category: 'driver', location: '', date: '', time: '' })}
                className="bg-white rounded-2xl border border-primary-dark/20 p-5 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-2">🚗</div>
                <h3 className="font-bold text-tmain text-sm">คนขับรถ</h3>
                <p className="text-xs text-tmuted mt-1">คนขับรถมืออาชีพทั่วประเทศ</p>
              </div>
              <div
                onClick={() => handleSearch({ category: 'translator', location: '', date: '', time: '' })}
                className="bg-white rounded-2xl border border-primary-dark/20 p-5 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-2">🌐</div>
                <h3 className="font-bold text-tmain text-sm">ล่าม / นักแปล</h3>
                <p className="text-xs text-tmuted mt-1">แปลเอกสาร ล่ามสด ซับไตเติ้ล</p>
              </div>
              <div
                onClick={() => { fetchPosts({ category: '', location: '', date: '', time: '' }); setSearchParams({ category: '', location: '', date: '', time: '' }); }}
                className="bg-white rounded-2xl border border-primary-dark/20 p-5 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-2">🔍</div>
                <h3 className="font-bold text-tmain text-sm">ดูทั้งหมด</h3>
                <p className="text-xs text-tmuted mt-1">เรียกดูบริการทั้งหมด</p>
              </div>
            </div>
          </div>

          <Footer />
        </>
      ) : (
        <>
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
                      onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
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
                      onClick={() => { setSearched(false); setFilters(defaultFilters); }}
                      className="mt-4 bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2 rounded-xl transition"
                    >
                      กลับหน้าหลัก
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostListItem
                        key={post.id}
                        post={post}
                        onBook={handleBook}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={() => { setSearched(false); setFilters(defaultFilters); }}
                    className="text-sm text-tmuted hover:bg-primary/20 px-4 py-2 rounded-lg transition"
                  >
                    ← กลับหน้าหลัก
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </>
      )}

      {bookingPost && (
        <BookingModal
          post={bookingPost}
          onClose={() => setBookingPost(null)}
        />
      )}
    </AppLayout>
  );
}
