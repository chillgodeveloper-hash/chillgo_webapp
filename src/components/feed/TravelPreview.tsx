'use client';

import Link from 'next/link';
import { Plane, Hotel, ArrowRight, ExternalLink, ChevronRight } from 'lucide-react';

const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '';

const flightRoutes = [
  { from: 'BKK', to: 'CNX', name: 'เชียงใหม่', nameEn: 'Chiang Mai', image: 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=640&h=480&fit=crop' },
  { from: 'BKK', to: 'HKT', name: 'ภูเก็ต', nameEn: 'Phuket', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=640&h=480&fit=crop' },
  { from: 'BKK', to: 'KBV', name: 'กระบี่', nameEn: 'Krabi', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=640&h=480&fit=crop' },
  { from: 'BKK', to: 'USM', name: 'สมุย', nameEn: 'Koh Samui', image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=640&h=480&fit=crop' },
];

const hotelDestinations = [
  { name: 'กรุงเทพ', nameEn: 'Bangkok', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=640&h=480&fit=crop' },
  { name: 'พัทยา', nameEn: 'Pattaya', image: 'https://images.unsplash.com/photo-1565361849078-294849288de5?w=640&h=480&fit=crop' },
  { name: 'หัวหิน', nameEn: 'Hua Hin', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=640&h=480&fit=crop' },
  { name: 'เชียงราย', nameEn: 'Chiang Rai', image: 'https://images.unsplash.com/photo-1512553135590-0af2655d4198?w=640&h=480&fit=crop' },
];

export default function TravelPreview() {
  const buildFlightLink = (from: string, to: string) => {
    let url = `https://www.aviasales.com/search/${from}${to}1`;
    if (MARKER) url += `?marker=${MARKER}`;
    return url;
  };

  const buildHotelLink = (cityNameEn: string) => {
    let url = `https://search.hotellook.com/hotels?destination=${encodeURIComponent(cityNameEn)}&adults=2`;
    if (MARKER) url += `&marker=${MARKER}`;
    return url;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-tmain flex items-center gap-2"><Plane size={24} className="text-secondary" /> เที่ยวบินยอดนิยม</h2>
          <Link href="/flights" className="text-sm text-secondary font-semibold hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {flightRoutes.map((route) => (
            <a key={route.to} href={buildFlightLink(route.from, route.to)} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl overflow-hidden border border-primary-dark/20 hover:border-secondary hover:shadow-md transition-all group">
              <div className="relative h-36 overflow-hidden">
                <img src={route.image} alt={route.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <h3 className="font-bold text-white text-sm drop-shadow">{route.name}</h3>
                  <p className="text-white/70 text-[11px] drop-shadow flex items-center gap-1">{route.from} <ArrowRight size={10} /> {route.to}</p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-xs text-tmuted">เปรียบเทียบราคา</span>
                <span className="text-[10px] text-tmuted group-hover:text-secondary transition flex items-center gap-0.5">ดูเที่ยวบิน <ExternalLink size={10} /></span>
              </div>
            </a>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-tmain flex items-center gap-2"><Hotel size={24} className="text-secondary" /> โรงแรมยอดนิยม</h2>
          <Link href="/hotels" className="text-sm text-secondary font-semibold hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {hotelDestinations.map((dest) => (
            <a key={dest.nameEn} href={buildHotelLink(dest.nameEn)} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl overflow-hidden border border-primary-dark/20 hover:border-secondary hover:shadow-md transition-all group">
              <div className="relative h-36 overflow-hidden">
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <h3 className="font-bold text-white text-sm drop-shadow">{dest.name}</h3>
                  <p className="text-white/70 text-[11px] drop-shadow">{dest.nameEn}</p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-xs text-tmuted">เปรียบเทียบราคา</span>
                <span className="text-[10px] text-tmuted group-hover:text-secondary transition flex items-center gap-0.5">ดูโรงแรม <ExternalLink size={10} /></span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
