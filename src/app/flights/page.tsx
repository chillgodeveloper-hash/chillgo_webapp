'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Plane, Search, Calendar, ExternalLink, MapPin, Users, ArrowRight } from 'lucide-react';
import FlatpickrInput from '@/components/ui/FlatpickrInput';

const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '';

const popularRoutes = [
  { from: 'BKK', to: 'CNX', name: 'เชียงใหม่', nameEn: 'Chiang Mai', image: 'https://photo.hotellook.com/static/cities/960x720/CNX.jpg', desc: 'ดอยสุเทพ วัดเก่า คาเฟ่สุดชิล' },
  { from: 'BKK', to: 'HKT', name: 'ภูเก็ต', nameEn: 'Phuket', image: 'https://photo.hotellook.com/static/cities/960x720/HKT.jpg', desc: 'หาดทรายขาว ทะเลอันดามัน' },
  { from: 'BKK', to: 'KBV', name: 'กระบี่', nameEn: 'Krabi', image: 'https://photo.hotellook.com/static/cities/960x720/KBV.jpg', desc: 'ทะเลแหวก เกาะพีพี ปีนหน้าผา' },
  { from: 'BKK', to: 'USM', name: 'สมุย', nameEn: 'Koh Samui', image: 'https://photo.hotellook.com/static/cities/960x720/USM.jpg', desc: 'เกาะสวรรค์ รีสอร์ทหรู หาดสวย' },
  { from: 'BKK', to: 'HDY', name: 'หาดใหญ่', nameEn: 'Hat Yai', image: 'https://photo.hotellook.com/static/cities/960x720/HDY.jpg', desc: 'เมืองใหญ่ภาคใต้ ตลาดสดของอร่อย' },
  { from: 'BKK', to: 'CEI', name: 'เชียงราย', nameEn: 'Chiang Rai', image: 'https://photo.hotellook.com/static/cities/960x720/CEI.jpg', desc: 'วัดร่องขุ่น สิงห์ปาร์ค ดอยตุง' },
  { from: 'BKK', to: 'NRT', name: 'โตเกียว', nameEn: 'Tokyo', image: 'https://photo.hotellook.com/static/cities/960x720/TYO.jpg', desc: 'ชิบูย่า อากิฮาบาระ ซากุระ' },
  { from: 'BKK', to: 'ICN', name: 'โซล', nameEn: 'Seoul', image: 'https://photo.hotellook.com/static/cities/960x720/SEL.jpg', desc: 'เมียงดง คังนัม วัดโชเกซา' },
  { from: 'BKK', to: 'SIN', name: 'สิงคโปร์', nameEn: 'Singapore', image: 'https://photo.hotellook.com/static/cities/960x720/SIN.jpg', desc: 'มารีน่าเบย์ การ์เด้นส์ ออร์ชาร์ด' },
  { from: 'BKK', to: 'HND', name: 'โอซาก้า', nameEn: 'Osaka', image: 'https://photo.hotellook.com/static/cities/960x720/OSA.jpg', desc: 'โดทงโบริ ปราสาทโอซาก้า ทาโกะยากิ' },
  { from: 'BKK', to: 'HKG', name: 'ฮ่องกง', nameEn: 'Hong Kong', image: 'https://photo.hotellook.com/static/cities/960x720/HKG.jpg', desc: 'วิคตอเรียพีค ดิสนีย์แลนด์ ติ่มซำ' },
  { from: 'BKK', to: 'KUL', name: 'กัวลาลัมเปอร์', nameEn: 'Kuala Lumpur', image: 'https://photo.hotellook.com/static/cities/960x720/KUL.jpg', desc: 'ตึกแฝดเปโตรนาส บาตูเคฟส์' },
];

export default function FlightsPage() {
  const [searchText, setSearchText] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const todayStr = new Date().toISOString().split('T')[0];

  const buildLink = (from: string, to: string) => {
    const dep = departDate ? departDate.replace(/-/g, '') : '';
    const ret = returnDate ? returnDate.replace(/-/g, '') : '';
    let searchCode = `${from}${dep}${to}${ret}${passengers}`;
    let url = `https://www.aviasales.com/search/${searchCode}`;
    if (MARKER) {
      url = `https://tp.media/r?marker=${MARKER}&trs=368880&p=4114&u=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const buildSearchLink = (destination: string) => {
    const dep = departDate ? departDate.replace(/-/g, '') : '';
    const ret = returnDate ? returnDate.replace(/-/g, '') : '';
    let url = `https://www.aviasales.com/search/BKK${dep}${destination}${ret}${passengers}`;
    if (MARKER) {
      url = `https://tp.media/r?marker=${MARKER}&trs=368880&p=4114&u=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;
    const code = searchText.trim().toUpperCase().slice(0, 3);
    window.open(buildSearchLink(code), '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const filtered = searchText.trim()
    ? popularRoutes.filter(
        (r) =>
          r.name.includes(searchText) ||
          r.nameEn.toLowerCase().includes(searchText.toLowerCase()) ||
          r.to.toLowerCase().includes(searchText.toLowerCase())
      )
    : popularRoutes;

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-primary via-primary-dark to-secondary py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl md:text-4xl font-extrabold text-tmain flex items-center justify-center gap-3">
              <Plane size={32} /> ค้นหาเที่ยวบิน
            </h1>
            <p className="text-tmain/70 text-sm mt-1">เปรียบเทียบราคาตั๋วเครื่องบินจากทั่วโลก</p>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-primary-dark/20">
            <div className="relative mb-3">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tmuted z-10" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="คุณอยากบินไปไหน? เช่น เชียงใหม่, Tokyo, Phuket..."
                className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-primary-dark/30 text-base text-tmain outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 placeholder:text-tmuted/60"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> วันไป</label>
                <FlatpickrInput value={departDate} onChange={setDepartDate} mode="date" minDate={todayStr} placeholder="วันไป" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> วันกลับ</label>
                <FlatpickrInput value={returnDate} onChange={setReturnDate} mode="date" minDate={departDate || todayStr} placeholder="วันกลับ" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Users size={12} /> ผู้โดยสาร</label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary bg-white"
                >
                  <option value={1}>1 คน</option>
                  <option value={2}>2 คน</option>
                  <option value={3}>3 คน</option>
                  <option value={4}>4 คน</option>
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="h-11 mt-auto bg-secondary hover:bg-secondary/90 text-tmain font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <Search size={18} /> ค้นหา
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="font-display text-xl font-bold text-tmain mb-2">
          {searchText.trim() ? `ผลการค้นหา "${searchText}"` : 'เส้นทางยอดนิยมจากกรุงเทพ'}
        </h2>
        <p className="text-sm text-tmuted mb-6">เลือกจุดหมายแล้วเปรียบเทียบราคาตั๋วเครื่องบิน</p>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-primary-dark/20 p-8 text-center">
            <Plane size={40} className="text-primary mx-auto mb-3" />
            <p className="text-tmain font-medium">ไม่พบเส้นทางที่ค้นหา</p>
            <p className="text-sm text-tmuted mt-1">กดปุ่มค้นหาเพื่อหาเที่ยวบินจากทั่วโลก</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((route) => (
              <a
                key={route.to}
                href={buildLink(route.from, route.to)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl overflow-hidden border border-primary-dark/20 hover:border-secondary hover:shadow-lg transition-all group"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={route.image}
                    alt={route.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://source.unsplash.com/640x480/?${encodeURIComponent(route.nameEn + ' city')}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="font-bold text-white text-lg drop-shadow">{route.name}</h3>
                    <p className="text-white/80 text-xs drop-shadow flex items-center gap-1">
                      {route.from} <ArrowRight size={12} /> {route.to} · {route.nameEn}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-tmuted line-clamp-1">{route.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-tmuted">เปรียบเทียบราคา</span>
                    <span className="inline-flex items-center gap-1 bg-secondary hover:bg-secondary/90 text-tmain font-semibold text-xs px-3 py-1.5 rounded-lg transition">
                      ดูเที่ยวบิน <ExternalLink size={11} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-tmuted mt-8">ข้อมูลจาก Aviasales · เปรียบเทียบราคาจากหลายสายการบินและตัวแทนจำหน่าย</p>
      </div>
    </AppLayout>
  );
}
