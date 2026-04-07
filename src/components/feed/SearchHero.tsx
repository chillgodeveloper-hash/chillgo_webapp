'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, Clock, Map, Car } from 'lucide-react';

interface SearchHeroProps {
  onSearch: (params: { category: string; location: string; date: string; time: string }) => void;
  compact?: boolean;
}

export default function SearchHero({ onSearch, compact = false }: SearchHeroProps) {
  const [category, setCategory] = useState('guide');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSearch = () => {
    onSearch({ category, location, date, time });
  };

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-primary-dark/20 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex bg-primary/20 rounded-xl p-1 gap-1">
            <button
              onClick={() => setCategory('guide')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                category === 'guide' ? 'bg-secondary text-tmain shadow-sm' : 'text-tmain hover:bg-primary/30'
              }`}
            >
              <Map size={14} className="inline mr-1.5" />ไกด์
            </button>
            <button
              onClick={() => setCategory('car_rental')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                category === 'car_rental' ? 'bg-secondary text-tmain shadow-sm' : 'text-tmain hover:bg-primary/30'
              }`}
            >
              <Car size={14} className="inline mr-1.5" />รถเช่า
            </button>
          </div>
        </div>
        <div className="space-y-3 mt-3">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="สถานที่ / จังหวัด / คำค้นหา"
            className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSearch}
              className="w-full h-12 bg-secondary hover:bg-secondary/90 text-tmain font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <Search size={16} /> ค้นหา
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-primary via-primary-dark to-secondary py-8 md:py-24 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h1 className="font-display text-2xl md:text-5xl font-extrabold text-tmain mb-2 md:mb-3">
          จัดทริปง่าย ๆ สไตล์คุณ
        </h1>
        <p className="text-tmuted text-sm md:text-lg mb-6 md:mb-8">
          ค้นหาไกด์มืออาชีพ และรถเช่าคุณภาพ สำหรับทริปในฝัน
        </p>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-primary-dark/20 w-full">
          <div className="flex justify-center mb-4">
            <div className="flex bg-primary/20 rounded-xl p-1 gap-1">
              <button
                onClick={() => setCategory('guide')}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  category === 'guide' ? 'bg-secondary text-tmain shadow-sm' : 'text-tmain hover:bg-primary/30'
                }`}
              >
                <Map size={16} /> ไกด์ท่องเที่ยว
              </button>
              <button
                onClick={() => setCategory('car_rental')}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  category === 'car_rental' ? 'bg-secondary text-tmain shadow-sm' : 'text-tmain hover:bg-primary/30'
                }`}
              >
                <Car size={16} /> รถเช่า
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tmuted" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="สถานที่ / จังหวัด / คำค้นหา"
                className="w-full min-w-0 h-14 pl-10 pr-3 rounded-xl border border-primary-dark/30 text-base text-tmain outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tmuted" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full min-w-0 h-12 pl-10 pr-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tmuted" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full min-w-0 h-12 pl-10 pr-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={handleSearch}
                className="w-full h-12 bg-secondary hover:bg-secondary/90 text-tmain font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md col-span-2 md:col-span-1"
              >
                <Search size={18} /> ค้นหา
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
