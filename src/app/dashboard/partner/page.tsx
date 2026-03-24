'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import CreatePostForm from '@/components/feed/CreatePostForm';
import { Trash2, Eye, EyeOff, Edit, BarChart3, Package } from 'lucide-react';
import { Post } from '@/types';

export default function PartnerDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ totalPosts: 0, totalBookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const { user, partnerProfile } = useAuthStore();
  const supabase = createClient();

  const fetchData = async () => {
    if (!partnerProfile) return;
    setLoading(true);

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('partner_id', partnerProfile.id)
      .order('created_at', { ascending: false });

    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', user?.id);

    const { data: paidBookings } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('partner_id', user?.id)
      .in('status', ['paid', 'completed']);

    const revenue = paidBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

    setPosts(postsData || []);
    setStats({
      totalPosts: postsData?.length || 0,
      totalBookings: bookingCount || 0,
      revenue,
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [partnerProfile]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('ต้องการลบโพสต์นี้?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchData();
  };

  const handleTogglePost = async (postId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'removed' : 'active';
    await supabase.from('posts').update({ status: newStatus }).eq('id', postId);
    fetchData();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 hidden lg:block">จัดการโพสต์</h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <Package size={20} className="text-secondary mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.totalPosts}</p>
            <p className="text-xs text-gray-500">โพสต์ทั้งหมด</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <BarChart3 size={20} className="text-info mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.totalBookings}</p>
            <p className="text-xs text-gray-500">การจองทั้งหมด</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <span className="text-secondary text-lg">฿</span>
            <p className="text-2xl font-bold text-gray-800">{stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">รายได้</p>
          </div>
        </div>

        <div className="mb-6">
          <CreatePostForm onSuccess={fetchData} />
        </div>

        <h2 className="font-bold text-gray-800 mb-3">โพสต์ของฉัน</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-4xl mb-2">📝</p>
            <p className="text-gray-500">ยังไม่มีโพสต์</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                {post.media_urls[0] && (
                  <img src={post.media_urls[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{post.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{post.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      post.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {post.status === 'active' ? 'แสดงอยู่' : 'ซ่อนอยู่'}
                    </span>
                    {post.price_min && (
                      <span className="text-xs text-secondary font-medium">฿{post.price_min.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePost(post.id, post.status)}
                    className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                    title={post.status === 'active' ? 'ซ่อน' : 'แสดง'}
                  >
                    {post.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center text-danger hover:bg-danger/20 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
