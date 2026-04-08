'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Hotel, Star, Search, Calendar, ExternalLink, RefreshCw, MapPin } from 'lucide-react';
import FlatpickrInput from '@/components/ui/FlatpickrInput';

interface HotelItem {
  id: number;
  name: string;
  stars: number;
  priceFrom: number;
  priceAvg: number;
  rating: number;
  photoUrl: string | null;
  link: string;
}

interface City {
  id: string;
  name: string;
  country: string;
  iata: string;
}

export default function HotelsPage() {
  const [cityId, setCityId] = useState('');
  const [cityText, setCityText] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [showCityDrop, setShowCityDrop] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityDrop(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchCity = async (query: string) => {
    if (query.length < 2) return;
    const res = await fetch(`/api/travel?type=city_lookup&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setCitySuggestions(data.cities || []);
    setShowCityDrop(true);
  };

  const handleSearch = async () => {
    if (!cityId) return;
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams({ type: 'hotels', city_id: cityId });
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);

    const res = await fetch(`/api/travel?${params}`);
    const data = await res.json();
    setHotels(data.hotels || []);
    setLoading(false);
  };

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
    ));
  };

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-primary via-primary-dark to-secondary py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl md:text-4xl font-extrabold text-tmain flex items-center justify-center gap-3">
              <Hotel size={32} /> ค้นหาโรงแรม
            </h1>
            <p className="text-tmain/70 text-sm mt-1">เปรียบเทียบราคาที่พักจากทั่วโลก</p>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-primary-dark/20">
            <div className="relative mb-3" ref={cityRef}>
              <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><MapPin size={12} /> เมือง / จุดหมาย</label>
              <input
                type="text"
                value={cityText}
                onChange={(e) => {
                  setCityText(e.target.value);
                  searchCity(e.target.value);
                }}
                placeholder="พิมพ์ชื่อเมือง เช่น Chiang Mai, Phuket, Tokyo..."
                className="w-full h-12 px-4 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
              {showCityDrop && citySuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border border-primary-dark/20 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {citySuggestions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCityId(c.id);
                        setCityText(`${c.name}${c.country ? `, ${c.country}` : ''}`);
                        setShowCityDrop(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-light/50 transition"
                    >
                      <span className="font-semibold text-tmain">{c.name}</span>
                      {c.country && <span className="text-tmuted ml-2">{c.country}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> เช็คอิน</label>
                <FlatpickrInput value={checkIn} onChange={setCheckIn} mode="date" minDate={todayStr} placeholder="วันเช็คอิน" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> เช็คเอาท์</label>
                <FlatpickrInput value={checkOut} onChange={setCheckOut} mode="date" minDate={checkIn || todayStr} placeholder="วันเช็คเอาท์" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !cityId}
                className="col-span-2 md:col-span-1 h-11 mt-auto bg-secondary hover:bg-secondary/90 text-tmain font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                ค้นหาโรงแรม
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!searched ? (
          <div className="text-center py-12">
            <Hotel size={48} className="text-primary mx-auto mb-3" />
            <p className="text-tmuted">ค้นหาที่พักราคาดีที่สุดจากทั่วโลก</p>
            <p className="text-xs text-tmuted mt-1">ข้อมูลจาก Hotellook · กดจองไปยังเว็บจองโรงแรมโดยตรง</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-primary/20" />
                <div className="p-4 space-y-2">
                  <div className="w-2/3 h-4 bg-primary/20 rounded" />
                  <div className="w-1/3 h-3 bg-primary/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-primary-dark/20">
            <p className="text-4xl mb-3">🏨</p>
            <p className="text-tmain font-medium">ไม่พบโรงแรม</p>
            <p className="text-sm text-tmuted mt-1">ลองค้นหาเมืองอื่น</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-tmuted mb-4">พบ {hotels.length} โรงแรม</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotels.map((h) => (
                <div key={h.id} className="bg-white rounded-2xl overflow-hidden border border-primary-dark/20 hover:border-primary/50 hover:shadow-md transition">
                  {h.photoUrl ? (
                    <img src={h.photoUrl} alt={h.name} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-primary-light flex items-center justify-center">
                      <Hotel size={40} className="text-primary" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-tmain truncate">{h.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          {renderStars(h.stars || 0)}
                        </div>
                      </div>
                      {h.rating > 0 && (
                        <span className="bg-secondary text-tmain text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
                          {h.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-xs text-tmuted">ราคาเริ่มต้น/คืน</p>
                        <p className="font-bold text-secondary text-lg">฿{h.priceFrom?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <a
                        href={h.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-secondary hover:bg-secondary/90 text-tmain font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                      >
                        จองเลย <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-tmuted mt-6">ข้อมูลจาก Hotellook · ราคาอาจเปลี่ยนแปลง · กดจองเพื่อไปยังเว็บจองโรงแรม</p>
          </>
        )}
      </div>
    </AppLayout>
  );
}
