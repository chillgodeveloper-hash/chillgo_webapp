'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Plane, ArrowRight, Search, ArrowLeftRight, Calendar, Users, ExternalLink, RefreshCw } from 'lucide-react';
import FlatpickrInput from '@/components/ui/FlatpickrInput';

interface Flight {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  departureAt: string;
  returnAt: string;
  transfers: number;
  affiliateLink: string;
}

interface Place {
  code: string;
  name: string;
  cityName: string;
  countryName: string;
}

export default function FlightsPage() {
  const [origin, setOrigin] = useState('BKK');
  const [originText, setOriginText] = useState('กรุงเทพ (BKK)');
  const [destination, setDestination] = useState('');
  const [destText, setDestText] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<Place[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Place[]>([]);
  const [showOriginDrop, setShowOriginDrop] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) setShowOriginDrop(false);
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDestDrop(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchAirport = async (query: string, type: 'origin' | 'dest') => {
    if (query.length < 2) return;
    const res = await fetch(`/api/travel?type=airport_lookup&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (type === 'origin') {
      setOriginSuggestions(data.places || []);
      setShowOriginDrop(true);
    } else {
      setDestSuggestions(data.places || []);
      setShowDestDrop(true);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({ type: 'flights', origin });
    if (destination) params.set('destination', destination);
    if (departDate) params.set('depart_date', departDate);
    if (returnDate) params.set('return_date', returnDate);
    if (!returnDate) params.set('one_way', 'true');

    const res = await fetch(`/api/travel?${params}`);
    const data = await res.json();
    setFlights(data.flights || []);
    setLoading(false);
  };

  const airlineLogoUrl = (code: string) => `https://pics.avs.io/60/60/${code}.png`;

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="relative" ref={originRef}>
                <label className="text-xs text-tmuted mb-1 block">ต้นทาง</label>
                <input
                  type="text"
                  value={originText}
                  onChange={(e) => {
                    setOriginText(e.target.value);
                    searchAirport(e.target.value, 'origin');
                  }}
                  placeholder="เมือง หรือ สนามบิน"
                  className="w-full h-12 px-4 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
                {showOriginDrop && originSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 bg-white border border-primary-dark/20 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {originSuggestions.map((p) => (
                      <button
                        key={p.code}
                        onClick={() => {
                          setOrigin(p.code);
                          setOriginText(`${p.cityName || p.name} (${p.code})`);
                          setShowOriginDrop(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-light/50 transition"
                      >
                        <span className="font-semibold text-tmain">{p.code}</span>
                        <span className="text-tmuted ml-2">{p.cityName || p.name}, {p.countryName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={destRef}>
                <label className="text-xs text-tmuted mb-1 block">ปลายทาง</label>
                <input
                  type="text"
                  value={destText}
                  onChange={(e) => {
                    setDestText(e.target.value);
                    searchAirport(e.target.value, 'dest');
                  }}
                  placeholder="เมือง หรือ สนามบิน (ว่างไว้ = ทุกเส้นทาง)"
                  className="w-full h-12 px-4 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
                {showDestDrop && destSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 bg-white border border-primary-dark/20 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {destSuggestions.map((p) => (
                      <button
                        key={p.code}
                        onClick={() => {
                          setDestination(p.code);
                          setDestText(`${p.cityName || p.name} (${p.code})`);
                          setShowDestDrop(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-light/50 transition"
                      >
                        <span className="font-semibold text-tmain">{p.code}</span>
                        <span className="text-tmuted ml-2">{p.cityName || p.name}, {p.countryName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> วันไป</label>
                <FlatpickrInput value={departDate} onChange={setDepartDate} mode="date" minDate={todayStr} placeholder="เลือกวันไป" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <div>
                <label className="text-xs text-tmuted mb-1 block flex items-center gap-1"><Calendar size={12} /> วันกลับ (ไม่บังคับ)</label>
                <FlatpickrInput value={returnDate} onChange={setReturnDate} mode="date" minDate={departDate || todayStr} placeholder="เลือกวันกลับ" className="w-full h-11 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain outline-none focus:border-primary cursor-pointer bg-white" />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="col-span-2 md:col-span-1 h-11 mt-auto bg-secondary hover:bg-secondary/90 text-tmain font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                ค้นหาเที่ยวบิน
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!searched ? (
          <div className="text-center py-12">
            <Plane size={48} className="text-primary mx-auto mb-3" />
            <p className="text-tmuted">ค้นหาเที่ยวบินราคาดีที่สุดจากทั่วโลก</p>
            <p className="text-xs text-tmuted mt-1">ข้อมูลจาก Aviasales · กดจองไปยังเว็บตัวแทนจำหน่ายโดยตรง</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse flex gap-4">
                <div className="w-14 h-14 bg-primary/20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-4 bg-primary/20 rounded" />
                  <div className="w-1/3 h-3 bg-primary/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-primary-dark/20">
            <p className="text-4xl mb-3">✈️</p>
            <p className="text-tmain font-medium">ไม่พบเที่ยวบิน</p>
            <p className="text-sm text-tmuted mt-1">ลองเปลี่ยนวันที่หรือเส้นทาง</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-tmuted mb-2">พบ {flights.length} เที่ยวบิน</p>
            {flights.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 md:p-5 border border-primary-dark/20 hover:border-primary/50 hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <img src={airlineLogoUrl(f.airline)} alt={f.airline} className="w-12 h-12 rounded-lg object-contain bg-primary-light/50 p-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-tmain font-semibold">
                      <span>{f.origin}</span>
                      <ArrowRight size={16} className="text-tmuted" />
                      <span>{f.destination}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tmuted mt-1">
                      <span>{new Date(f.departureAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                      {f.returnAt && (
                        <>
                          <ArrowLeftRight size={12} />
                          <span>{new Date(f.returnAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                        </>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${f.transfers === 0 ? 'bg-success/10 text-success' : 'bg-primary-light text-tmuted'}`}>
                        {f.transfers === 0 ? 'บินตรง' : `${f.transfers} ต่อเครื่อง`}
                      </span>
                      <span>{f.airline}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-secondary text-lg">฿{f.price?.toLocaleString()}</p>
                    <a
                      href={f.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-secondary hover:bg-secondary/90 text-tmain font-semibold text-xs px-4 py-2 rounded-lg transition mt-1"
                    >
                      จองเลย <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-center text-[11px] text-tmuted mt-4">ข้อมูลจาก Aviasales · ราคาอาจเปลี่ยนแปลง · กดจองเพื่อไปยังเว็บตัวแทนจำหน่าย</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
