'use client';

import { useState } from 'react';
import { Star, X, SlidersHorizontal } from 'lucide-react';

interface FilterState {
  priceMin: string;
  priceMax: string;
  rating: number;
  verified: boolean;
  category: string;
  location: string;
}

interface SearchFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const defaultFilters: FilterState = {
  priceMin: '',
  priceMax: '',
  rating: 0,
  verified: false,
  category: '',
  location: '',
};

export default function SearchFilter({ filters, onChange, onReset }: SearchFilterProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = filters.priceMin || filters.priceMax || filters.rating > 0 || filters.verified || filters.location;

  const content = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-tmain flex items-center gap-2"><SlidersHorizontal size={16} /> ตัวกรอง</h3>
        {hasFilters && (
          <button onClick={onReset} className="text-xs text-tmuted hover:bg-primary/20 px-2 py-1 rounded-lg transition">ล้างทั้งหมด</button>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-tmain mb-2 block">ประเภท</label>
        <div className="flex gap-2">
          <button onClick={() => update('category', '')} className={`flex-1 h-10 rounded-lg text-xs font-medium transition ${filters.category === '' ? 'bg-secondary text-tmain' : 'bg-primary/20 text-tmain hover:bg-primary/30'}`}>ทั้งหมด</button>
          <button onClick={() => update('category', 'guide')} className={`flex-1 h-10 rounded-lg text-xs font-medium transition ${filters.category === 'guide' ? 'bg-secondary text-tmain' : 'bg-primary/20 text-tmain hover:bg-primary/30'}`}>🗺️ ไกด์</button>
          <button onClick={() => update('category', 'car_rental')} className={`flex-1 h-10 rounded-lg text-xs font-medium transition ${filters.category === 'car_rental' ? 'bg-secondary text-tmain' : 'bg-primary/20 text-tmain hover:bg-primary/30'}`}>🚗 รถเช่า</button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-tmain mb-2 block">ช่วงราคา (฿)</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={filters.priceMin} onChange={(e) => update('priceMin', e.target.value)} placeholder="ต่ำสุด" className="w-full min-w-0 h-10 px-3 rounded-lg border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary" />
          <input type="number" value={filters.priceMax} onChange={(e) => update('priceMax', e.target.value)} placeholder="สูงสุด" className="w-full min-w-0 h-10 px-3 rounded-lg border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-tmain mb-2 block">คะแนนขั้นต่ำ</label>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => update('rating', s === filters.rating ? 0 : s)} className={`flex-1 h-10 rounded-lg text-xs font-medium transition flex items-center justify-center gap-0.5 ${filters.rating === s && s > 0 ? 'bg-secondary text-tmain' : 'bg-primary/20 text-tmain hover:bg-primary/30'}`}>
              {s === 0 ? 'ทั้งหมด' : <><Star size={12} className="text-amber-500 fill-amber-500" /> {s}+</>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-tmain mb-2 block">สถานที่ / จังหวัด</label>
        <input type="text" value={filters.location} onChange={(e) => update('location', e.target.value)} placeholder="ค้นหาสถานที่..." className="w-full min-w-0 h-10 px-3 rounded-lg border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary" />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={filters.verified} onChange={(e) => update('verified', e.target.checked)} className="w-5 h-5 accent-primary rounded" />
        <span className="text-sm text-tmain">เฉพาะพาร์ทเนอร์ที่ยืนยันแล้ว</span>
      </label>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-primary-dark/20 p-5 sticky top-20">
          {content}
        </div>
      </div>

      <div className="lg:hidden mb-4">
        <button onClick={() => setMobileOpen(true)} className="flex items-center gap-2 bg-white border border-primary-dark/20 px-4 h-10 rounded-xl text-sm text-tmain hover:bg-primary/20 transition">
          <SlidersHorizontal size={16} /> ตัวกรอง {hasFilters && <span className="w-2 h-2 bg-secondary rounded-full" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-tmain">ตัวกรอง</h3>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><X size={18} /></button>
            </div>
            {content}
            <button onClick={() => setMobileOpen(false)} className="w-full mt-4 bg-primary hover:bg-primary-dark text-tmain font-semibold h-12 rounded-xl transition">ใช้ตัวกรอง</button>
          </div>
        </div>
      )}
    </>
  );
}
