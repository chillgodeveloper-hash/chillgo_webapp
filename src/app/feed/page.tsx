'use client';

import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import SearchHero from '@/components/feed/SearchHero';
import Footer from '@/components/layout/Footer';
import TravelPreview from '@/components/feed/TravelPreview';

export default function FeedPage() {
  const router = useRouter();

  const goToSearch = (params: { category: string; location: string; date: string; time: string }) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('cat', params.category);
    if (params.location) qs.set('loc', params.location);
    if (params.date) qs.set('date', params.date);
    if (params.time) qs.set('time', params.time);
    router.push(`/search?${qs.toString()}`);
  };

  return (
    <AppLayout>
      <SearchHero onSearch={goToSearch} />

      <div className="max-w-7xl mx-auto px-4 py-12 animate-blur-in">
        <h2 className="font-display text-2xl font-bold text-tmain mb-6 text-center">บริการยอดนิยม</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => goToSearch({ category: 'guide', location: '', date: '', time: '' })}
            className="bg-white rounded-2xl border border-primary-dark/20 p-5 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-4xl mb-2">🗺️</div>
            <h3 className="font-bold text-tmain text-sm">ไกด์ท่องเที่ยว</h3>
            <p className="text-xs text-tmuted mt-1">ไกด์มืออาชีพพาเที่ยวทั่วไทย</p>
          </button>
          <button
            onClick={() => goToSearch({ category: 'driver', location: '', date: '', time: '' })}
            className="bg-white rounded-2xl border border-primary-dark/20 p-5 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-4xl mb-2">🚗</div>
            <h3 className="font-bold text-tmain text-sm">คนขับรถ</h3>
            <p className="text-xs text-tmuted mt-1">คนขับรถมืออาชีพทั่วประเทศ</p>
          </button>
          <button
            onClick={() => goToSearch({ category: '', location: '', date: '', time: '' })}
            className="bg-white rounded-2xl border border-primary-dark/20 p-5 text-center cursor-pointer hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="font-bold text-tmain text-sm">ดูทั้งหมด</h3>
            <p className="text-xs text-tmuted mt-1">เรียกดูบริการทั้งหมด</p>
          </button>
        </div>
      </div>

      <TravelPreview />

      <Footer />
    </AppLayout>
  );
}
