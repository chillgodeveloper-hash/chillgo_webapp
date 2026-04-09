'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Hotel, Search, Calendar, ExternalLink, MapPin, Users, Globe } from 'lucide-react';
import FlatpickrInput from '@/components/ui/FlatpickrInput';

const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '';

const popularDestinations = [
  { name: 'กรุงเทพ', nameEn: 'Bangkok', image: 'https://photo.hotellook.com/static/cities/960x720/BKK.jpg', desc: 'เมืองหลวงที่ไม่เคยหลับ วัด ช้อปปิ้ง สตรีทฟู้ด' },
  { name: 'เชียงใหม่', nameEn: 'Chiang Mai', image: 'https://photo.hotellook.com/static/cities/960x720/CNX.jpg', desc: 'ดอยสุเทพ ย่านเมืองเก่า คาเฟ่สุดชิล' },
  { name: 'ภูเก็ต', nameEn: 'Phuket', image: 'https://photo.hotellook.com/static/cities/960x720/HKT.jpg', desc: 'หาดทรายขาว น้ำทะเลใส ไนท์ไลฟ์คึกคัก' },
  { name: 'กระบี่', nameEn: 'Krabi', image: 'https://photo.hotellook.com/static/cities/960x720/KBV.jpg', desc: 'ทะเลแหวก เกาะพีพี หน้าผาหินปูน' },
  { name: 'พัทยา', nameEn: 'Pattaya', image: 'https://photo.hotellook.com/static/cities/960x720/UTP.jpg', desc: 'ชายหาดใกล้กรุงเทพ วอล์คกิ้งสตรีท เกาะล้าน' },
  { name: 'เชียงราย', nameEn: 'Chiang Rai', image: 'https://photo.hotellook.com/static/cities/960x720/CEI.jpg', desc: 'วัดร่องขุ่น สิงห์ปาร์ค ดอยตุง' },
  { name: 'สมุย', nameEn: 'Koh Samui', image: 'https://photo.hotellook.com/static/cities/960x720/USM.jpg', desc: 'เกาะสวรรค์อ่าวไทย รีสอร์ทหรู หาดสวย' },
  { name: 'หัวหิน', nameEn: 'Hua Hin', image: 'https://photo.hotellook.com/static/cities/960x720/HHQ.jpg', desc: 'ชายทะเลหลวง ตลาดโต้รุ่ง วังไกลกังวล' },
  { name: 'เกาะช้าง', nameEn: 'Koh Chang', image: 'https://photo.hotellook.com/static/cities/960x720/TDX.jpg', desc: 'เกาะใหญ่อันดับ 2 น้ำตกสวย ป่าเขียว' },
  { name: 'เกาะพะงัน', nameEn: 'Koh Phangan', image: 'https://photo.hotellook.com/static/cities/960x720/USM.jpg', desc: 'Full Moon Party หาดริ้น โยคะ' },
  { name: 'กาญจนบุรี', nameEn: 'Kanchanaburi', image: 'https://photo.hotellook.com/static/cities/960x720/KAN.jpg', desc: 'สะพานข้ามแม่น้ำแคว น้ำตกเอราวัณ' },
  { name: 'อยุธยา', nameEn: 'Ayutthaya', image: 'https://photo.hotellook.com/static/cities/960x720/BKK.jpg', desc: 'โบราณสถาน วัดมหาธาตุ ตลาดน้ำ' },
  { name: 'เกาะลันตา', nameEn: 'Koh Lanta', image: 'https://photo.hotellook.com/static/cities/960x720/KBV.jpg', desc: 'หาดสวยเงียบสงบ อุทยานแห่งชาติ' },
  { name: 'ปาย', nameEn: 'Pai', image: 'https://photo.hotellook.com/static/cities/960x720/CNX.jpg', desc: 'สะพานปาย ทุ่งดอกบัวตอง กาแฟดี' },
  { name: 'เขาหลัก', nameEn: 'Khao Lak', image: 'https://photo.hotellook.com/static/cities/960x720/HKT.jpg', desc: 'หาดสงบ ดำน้ำหมู่เกาะสิมิลัน' },
  { name: 'น่าน', nameEn: 'Nan', image: 'https://photo.hotellook.com/static/cities/960x720/NNT.jpg', desc: 'เมืองเก่า วัดภูมินทร์ ดอยเสมอดาว' },
  { name: 'ตราด', nameEn: 'Trat', image: 'https://photo.hotellook.com/static/cities/960x720/TDX.jpg', desc: 'ประตูสู่เกาะช้าง เกาะหมาก เกาะกูด' },
  { name: 'ระยอง', nameEn: 'Rayong', image: 'https://photo.hotellook.com/static/cities/960x720/UTP.jpg', desc: 'เกาะเสม็ด หาดแม่รำพึง สวนผลไม้' },
];

export default function HotelsPage() {
  const [searchText, setSearchText] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);

  const todayStr = new Date().toISOString().split('T')[0];

  const buildLink = (cityNameEn: string) => {
    let url = `https://search.hotellook.com/hotels?destination=${encodeURIComponent(cityNameEn)}&adults=${adults}`;
    if (checkIn) url += `&checkIn=${checkIn}`;
    if (checkOut) url += `&checkOut=${checkOut}`;
    if (MARKER) url += `&marker=${MARKER}`;
    return url;
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      window.open(MARKER ? `https://search.hotellook.com/?marker=${MARKER}` : 'https://search.hotellook.com/', '_blank');
      return;
    }
    window.open(buildLink(searchText.trim()), '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const filtered = searchText.trim()
    ? popularDestinations.filter(
        (d) =>
          d.name.includes(searchText) ||
          d.nameEn.toLowerCase().includes(searchText.toLowerCase())
      )
    : popularDestinations;

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-primary via-primary-dark to-secondary py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl md:text-4xl font-extrabold text-tmain flex items-center justify-center gap-3">
              <Hotel size={32} /> โรงแรมในประเทศไทย
            </h1>
            <p className="text-tmain/70 text-sm mt-1">เปรียบเทียบราคาที่พักจากหลายเว็บในที่เดียว</p>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-primary-dark/20">
            <div className="relative mb-3">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tmuted z-10" />
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={handleKeyDown} placeholder="พิมพ์ชื่อเมือง เช่น เชียงใหม่, ภูเก็ต, หัวหิน..." className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-primary-dark/30 text-base text-tmain outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 placeholder:text-tmuted/60" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> เช็คอิน</label>
                <FlatpickrInput value={checkIn} onChange={setCheckIn} mode="date" minDate={todayStr} placeholder="วันเช็คอิน" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> เช็คเอาท์</label>
                <FlatpickrInput value={checkOut} onChange={setCheckOut} mode="date" minDate={checkIn || todayStr} placeholder="วันเช็คเอาท์" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Users size={12} /> ผู้เข้าพัก</label>
                <select value={adults} onChange={(e) => setAdults(parseInt(e.target.value))} className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary bg-white">
                  <option value={1}>1 คน</option>
                  <option value={2}>2 คน</option>
                  <option value={3}>3 คน</option>
                  <option value={4}>4 คน</option>
                </select>
              </div>
              <button onClick={handleSearch} className="h-11 mt-auto bg-secondary hover:bg-secondary/90 text-tmain font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md">
                <Search size={18} /> ค้นหา
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="font-display text-xl font-bold text-tmain mb-2">
          {searchText.trim() ? `ผลการค้นหา "${searchText}"` : 'ที่พักยอดนิยมทั่วไทย'}
        </h2>
        <p className="text-sm text-tmuted mb-6">เลือกเมืองแล้วเปรียบเทียบราคาที่พัก</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dest) => (
            <a key={dest.nameEn} href={buildLink(dest.nameEn)} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl overflow-hidden border border-primary-dark/20 hover:border-secondary hover:shadow-lg transition-all group">
              <div className="relative h-44 overflow-hidden">
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="font-bold text-white text-lg drop-shadow">{dest.name}</h3>
                  <p className="text-white/80 text-xs drop-shadow">{dest.nameEn}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-tmuted line-clamp-1">{dest.desc}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-tmuted">เปรียบเทียบราคา</span>
                  <span className="inline-flex items-center gap-1 bg-secondary hover:bg-secondary/90 text-tmain font-semibold text-xs px-3 py-1.5 rounded-lg transition">ดูโรงแรม <ExternalLink size={11} /></span>
                </div>
              </div>
            </a>
          ))}
          <a href={MARKER ? `https://search.hotellook.com/?marker=${MARKER}` : 'https://search.hotellook.com/'} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl overflow-hidden border-2 border-dashed border-primary-dark/30 hover:border-secondary hover:shadow-lg transition-all group flex flex-col items-center justify-center min-h-[280px]">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition"><Globe size={28} className="text-secondary" /></div>
            <h3 className="font-bold text-tmain text-lg">ค้นหาที่พักอื่น ๆ</h3>
            <p className="text-sm text-tmuted mt-1">โรงแรมทั่วไทยกว่าหมื่นแห่ง</p>
            <span className="inline-flex items-center gap-1 bg-secondary text-tmain font-semibold text-xs px-4 py-2 rounded-lg mt-4 transition">เปิด Hotellook <ExternalLink size={11} /></span>
          </a>
        </div>
        <p className="text-center text-[11px] text-tmuted mt-8">เปรียบเทียบราคาจาก Booking.com, Agoda, Hotels.com และอื่น ๆ</p>
      </div>
    </AppLayout>
  );
}
