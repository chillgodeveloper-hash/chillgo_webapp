'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, Hotel, ArrowRight, Star, ExternalLink, ChevronRight } from 'lucide-react';

interface Flight {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  departureAt: string;
  transfers: number;
  affiliateLink: string;
}

interface HotelItem {
  id: number;
  name: string;
  stars: number;
  priceFrom: number;
  rating: number;
  photoUrl: string | null;
  link: string;
}

export default function TravelPreview() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(true);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const res = await fetch('/api/travel?type=flights_popular&origin=BKK');
        const data = await res.json();
        setFlights((data.flights || []).slice(0, 4));
      } catch {}
      setLoadingFlights(false);
    };

    const fetchHotels = async () => {
      try {
        const res = await fetch('/api/travel?type=hotels_popular&city_id=12549');
        const data = await res.json();
        setHotels((data.hotels || []).slice(0, 4));
      } catch {}
      setLoadingHotels(false);
    };

    fetchFlights();
    fetchHotels();
  }, []);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-tmain flex items-center gap-2">
            <Plane size={24} className="text-secondary" /> เที่ยวบินราคาดี
          </h2>
          <Link href="/flights" className="text-sm text-secondary font-semibold hover:underline flex items-center gap-1">
            ดูทั้งหมด <ChevronRight size={16} />
          </Link>
        </div>

        {loadingFlights ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-primary/20 rounded w-2/3 mb-3" />
                <div className="h-3 bg-primary/20 rounded w-1/2 mb-2" />
                <div className="h-6 bg-primary/20 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : flights.length === 0 ? (
          <div className="bg-white rounded-2xl border border-primary-dark/20 p-8 text-center">
            <p className="text-tmuted">ไม่พบข้อมูลเที่ยวบินในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {flights.map((f, i) => (
              <a
                key={i}
                href={f.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl p-4 border border-primary-dark/20 hover:border-secondary hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img src={`https://pics.avs.io/40/40/${f.airline}.png`} alt="" className="w-8 h-8 rounded object-contain" />
                  <div className="flex items-center gap-1.5 text-tmain font-semibold text-sm">
                    {f.origin} <ArrowRight size={14} className="text-tmuted" /> {f.destination}
                  </div>
                </div>
                <p className="text-xs text-tmuted">
                  {new Date(f.departureAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  {' · '}
                  <span className={f.transfers === 0 ? 'text-success' : ''}>{f.transfers === 0 ? 'บินตรง' : `${f.transfers} ต่อ`}</span>
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-secondary">฿{f.price?.toLocaleString()}</p>
                  <span className="text-[10px] text-tmuted group-hover:text-secondary transition flex items-center gap-0.5">
                    จองเลย <ExternalLink size={10} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-tmain flex items-center gap-2">
            <Hotel size={24} className="text-secondary" /> โรงแรมยอดนิยม
          </h2>
          <Link href="/hotels" className="text-sm text-secondary font-semibold hover:underline flex items-center gap-1">
            ดูทั้งหมด <ChevronRight size={16} />
          </Link>
        </div>

        {loadingHotels ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-primary/20" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-primary/20 rounded w-2/3" />
                  <div className="h-5 bg-primary/20 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-primary-dark/20 p-8 text-center">
            <p className="text-tmuted">ไม่พบข้อมูลโรงแรมในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {hotels.map((h) => (
              <a
                key={h.id}
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl overflow-hidden border border-primary-dark/20 hover:border-secondary hover:shadow-md transition-all group"
              >
                {h.photoUrl ? (
                  <img src={h.photoUrl} alt={h.name} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-primary-light flex items-center justify-center">
                    <Hotel size={32} className="text-primary" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-tmain text-sm truncate">{h.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: h.stars || 0 }, (_, i) => (
                      <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                    {h.rating > 0 && <span className="text-[10px] text-tmuted ml-1">{h.rating.toFixed(1)}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-[10px] text-tmuted">เริ่มต้น/คืน</p>
                      <p className="font-bold text-secondary text-sm">฿{h.priceFrom?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <span className="text-[10px] text-tmuted group-hover:text-secondary transition flex items-center gap-0.5">
                      จองเลย <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
