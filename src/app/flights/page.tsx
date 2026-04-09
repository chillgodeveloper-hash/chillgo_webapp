'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Plane, Search, Calendar, ExternalLink, MapPin, Users, ArrowRight, Globe } from 'lucide-react';
import FlatpickrInput from '@/components/ui/FlatpickrInput';

const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '';

const popularRoutes = [
  { from: 'BKK', to: 'CNX', name: 'เชียงใหม่', nameEn: 'Chiang Mai', image: 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=640&h=480&fit=crop', desc: 'ดอยสุเทพ วัดเก่า คาเฟ่สุดชิล' },
  { from: 'BKK', to: 'HKT', name: 'ภูเก็ต', nameEn: 'Phuket', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=640&h=480&fit=crop', desc: 'หาดทรายขาว ทะเลอันดามัน ป่าตอง' },
  { from: 'BKK', to: 'KBV', name: 'กระบี่', nameEn: 'Krabi', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=640&h=480&fit=crop', desc: 'ทะเลแหวก เกาะพีพี ปีนหน้าผา' },
  { from: 'BKK', to: 'USM', name: 'สมุย', nameEn: 'Koh Samui', image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=640&h=480&fit=crop', desc: 'เกาะสวรรค์ รีสอร์ทหรู หินตาหินยาย' },
  { from: 'BKK', to: 'HDY', name: 'หาดใหญ่', nameEn: 'Hat Yai', image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=640&h=480&fit=crop', desc: 'ตลาดกิมหยง ไก่ทอด ตลาดสดใหญ่' },
  { from: 'BKK', to: 'CEI', name: 'เชียงราย', nameEn: 'Chiang Rai', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=640&h=480&fit=crop', desc: 'วัดร่องขุ่น สิงห์ปาร์ค ดอยตุง' },
  { from: 'BKK', to: 'URT', name: 'สุราษฎร์ธานี', nameEn: 'Surat Thani', image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=640&h=480&fit=crop', desc: 'ประตูสู่เกาะสมุย เขื่อนรัชชประภา' },
  { from: 'BKK', to: 'NST', name: 'นครศรีธรรมราช', nameEn: 'Nakhon Si Thammarat', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=640&h=480&fit=crop', desc: 'วัดพระมหาธาตุ ขนมจีน เขาหลวง' },
  { from: 'BKK', to: 'UBP', name: 'อุบลราชธานี', nameEn: 'Ubon Ratchathani', image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=640&h=480&fit=crop', desc: 'สามพันโบก ผาแต้ม แก่งหินผาสาด' },
  { from: 'BKK', to: 'UTH', name: 'อุดรธานี', nameEn: 'Udon Thani', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=640&h=480&fit=crop', desc: 'ทะเลบัวแดง วัดป่าบ้านตาด' },
  { from: 'BKK', to: 'KKC', name: 'ขอนแก่น', nameEn: 'Khon Kaen', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=640&h=480&fit=crop', desc: 'พระธาตุขามแก่น บึงแก่นนคร' },
  { from: 'BKK', to: 'TST', name: 'ตรัง', nameEn: 'Trang', image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=640&h=480&fit=crop', desc: 'เกาะลิบง ถ้ำมรกต หมูย่างเมืองตรัง' },
  { from: 'BKK', to: 'LOE', name: 'เลย', nameEn: 'Loei', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&h=480&fit=crop', desc: 'ภูกระดึง เชียงคาน ผีตาโขน' },
  { from: 'BKK', to: 'HHQ', name: 'หัวหิน', nameEn: 'Hua Hin', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=640&h=480&fit=crop', desc: 'ชายทะเลหลวง วังไกลกังวล ตลาดโต้รุ่ง' },
  { from: 'BKK', to: 'UTP', name: 'พัทยา', nameEn: 'Pattaya', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=640&h=480&fit=crop', desc: 'วอล์คกิ้งสตรีท เกาะล้าน ชายหาด' },
  { from: 'BKK', to: 'PHS', name: 'พิษณุโลก', nameEn: 'Phitsanulok', image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=640&h=480&fit=crop', desc: 'พระพุทธชินราช น้ำตกแก่งโสภา' },
  { from: 'BKK', to: 'NAK', name: 'นครราชสีมา', nameEn: 'Nakhon Ratchasima', image: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=640&h=480&fit=crop', desc: 'เขาใหญ่ พิมาย ย่าโม' },
  { from: 'BKK', to: 'RNT', name: 'ระนอง', nameEn: 'Ranong', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=640&h=480&fit=crop', desc: 'บ่อน้ำร้อน เกาะพยาม น้ำตก' },
];

export default function FlightsPage() {
  const [searchText, setSearchText] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const todayStr = new Date().toISOString().split('T')[0];
  const buildLink = (from: string, to: string) => {
    let url = `https://www.aviasales.com/search/${from}${departDate ? departDate.replace(/-/g, '') : ''}${to}${returnDate ? returnDate.replace(/-/g, '') : ''}${passengers}`;
    if (MARKER) url += `?marker=${MARKER}`;
    return url;
  };
  const handleSearch = () => {
    if (!searchText.trim()) { window.open(MARKER ? `https://www.aviasales.com/?marker=${MARKER}` : 'https://www.aviasales.com/', '_blank'); return; }
    const code = searchText.trim().toUpperCase().slice(0, 3);
    window.open(buildLink('BKK', code), '_blank');
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };
  const filtered = searchText.trim() ? popularRoutes.filter((r) => r.name.includes(searchText) || r.nameEn.toLowerCase().includes(searchText.toLowerCase()) || r.to.toLowerCase().includes(searchText.toLowerCase())) : popularRoutes;
  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-primary via-primary-dark to-secondary py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl md:text-4xl font-extrabold text-tmain flex items-center justify-center gap-3"><Plane size={32} /> เที่ยวบินในประเทศไทย</h1>
            <p className="text-tmain/70 text-sm mt-1">เปรียบเทียบราคาตั๋วเครื่องบินทั่วไทย</p>
          </div>
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-primary-dark/20">
            <div className="relative mb-3"><MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tmuted z-10" /><input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={handleKeyDown} placeholder="คุณอยากบินไปไหน? เช่น เชียงใหม่, ภูเก็ต, กระบี่..." className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-primary-dark/30 text-base text-tmain outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 placeholder:text-tmuted/60" /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> วันไป</label><FlatpickrInput value={departDate} onChange={setDepartDate} mode="date" minDate={todayStr} placeholder="วันไป" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" /></div>
              <div><label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> วันกลับ</label><FlatpickrInput value={returnDate} onChange={setReturnDate} mode="date" minDate={departDate || todayStr} placeholder="วันกลับ" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" /></div>
              <div><label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Users size={12} /> ผู้โดยสาร</label><select value={passengers} onChange={(e) => setPassengers(parseInt(e.target.value))} className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary bg-white"><option value={1}>1 คน</option><option value={2}>2 คน</option><option value={3}>3 คน</option><option value={4}>4 คน</option></select></div>
              <button onClick={handleSearch} className="h-11 mt-auto bg-secondary hover:bg-secondary/90 text-tmain font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md"><Search size={18} /> ค้นหา</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="font-display text-xl font-bold text-tmain mb-2">{searchText.trim() ? `ผลการค้นหา "${searchText}"` : 'เส้นทางบินยอดนิยมจากกรุงเทพ'}</h2>
        <p className="text-sm text-tmuted mb-6">เลือกจุดหมายแล้วเปรียบเทียบราคาตั๋วเครื่องบิน</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((route) => (
            <a key={route.to} href={buildLink(route.from, route.to)} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl overflow-hidden border border-primary-dark/20 hover:border-secondary hover:shadow-lg transition-all group">
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30">
                <img src={route.image} alt={route.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3"><h3 className="font-bold text-white text-lg drop-shadow">{route.name}</h3><p className="text-white/80 text-xs drop-shadow flex items-center gap-1">{route.from} <ArrowRight size={12} /> {route.to} · {route.nameEn}</p></div>
              </div>
              <div className="p-4"><p className="text-sm text-tmuted line-clamp-1">{route.desc}</p><div className="flex items-center justify-between mt-3"><span className="text-xs text-tmuted">เปรียบเทียบราคา</span><span className="inline-flex items-center gap-1 bg-secondary hover:bg-secondary/90 text-tmain font-semibold text-xs px-3 py-1.5 rounded-lg transition">ดูเที่ยวบิน <ExternalLink size={11} /></span></div></div>
            </a>
          ))}
          <a href={MARKER ? `https://www.aviasales.com/?marker=${MARKER}` : 'https://www.aviasales.com/'} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl overflow-hidden border-2 border-dashed border-primary-dark/30 hover:border-secondary hover:shadow-lg transition-all group flex flex-col items-center justify-center min-h-[280px]">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition"><Globe size={28} className="text-secondary" /></div>
            <h3 className="font-bold text-tmain text-lg">ค้นหาเส้นทางอื่น ๆ</h3><p className="text-sm text-tmuted mt-1">บินไปที่ไหนก็ได้ทั่วไทย</p>
            <span className="inline-flex items-center gap-1 bg-secondary text-tmain font-semibold text-xs px-4 py-2 rounded-lg mt-4 transition">เปิด Aviasales <ExternalLink size={11} /></span>
          </a>
        </div>
        <p className="text-center text-[11px] text-tmuted mt-8">เปรียบเทียบราคาจากหลายสายการบิน · Thai Airways, AirAsia, Nok Air, Thai Lion Air และอื่น ๆ</p>
      </div>
    </AppLayout>
  );
}
