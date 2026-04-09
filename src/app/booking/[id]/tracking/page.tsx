'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useGeoTracking } from '@/hooks/useGeoTracking';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Clock, Wifi, WifiOff, Radio } from 'lucide-react';

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
}

export default function TrackingPage() {
  const { id: bookingId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const supabase = createClient();

  const [booking, setBooking] = useState<any>(null);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<any>(null);

  const isPartner = user?.role === 'partner' && booking?.partner_id === user?.id;
  const isInProgress = booking?.status === 'in_progress';

  const geo = useGeoTracking({
    bookingId: bookingId as string,
    userId: user?.id || '',
    enabled: isPartner && isInProgress,
    intervalMs: 30000,
  });

  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, post:posts!bookings_post_id_fkey(title)')
        .eq('id', bookingId)
        .single();

      if (data) {
        setBooking(data);
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.partner_id).single();
        if (profile) setPartnerName(profile.full_name);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('booking_locations')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      if (data) setLocations(data);
    };
    fetchLocations();

    const channel = supabase
      .channel(`tracking-${bookingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_locations',
        filter: `booking_id=eq.${bookingId}`,
      }, (payload: any) => {
        setLocations(prev => [...prev, payload.new as LocationPoint]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      if (document.getElementById('leaflet-css')) {
        const leaflet = await import('leaflet');
        setL(leaflet.default);
        setMapReady(true);
        return;
      }

      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      link.onload = async () => {
        const leaflet = await import('leaflet');
        setL(leaflet.default);
        setMapReady(true);
      };
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!mapReady || !L || !mapRef.current || leafletMapRef.current) return;

    const defaultCenter: [number, number] = [13.7563, 100.5018];
    const lastLoc = locations[locations.length - 1];
    const center: [number, number] = lastLoc
      ? [lastLoc.latitude, lastLoc.longitude]
      : defaultCenter;

    const map = L.map(mapRef.current, {
      center,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    if (locations.length > 0) {
      updateMapMarkers(locations);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
        polylineRef.current = null;
      }
    };
  }, [mapReady, L]);

  useEffect(() => {
    if (!leafletMapRef.current || !L || locations.length === 0) return;
    updateMapMarkers(locations);
  }, [locations, L]);

  const updateMapMarkers = (locs: LocationPoint[]) => {
    if (!leafletMapRef.current || !L || locs.length === 0) return;

    const map = leafletMapRef.current;
    const last = locs[locs.length - 1];

    const partnerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:36px;height:36px;background:#22c55e;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([last.latitude, last.longitude]);
    } else {
      markerRef.current = L.marker([last.latitude, last.longitude], { icon: partnerIcon })
        .addTo(map)
        .bindPopup(`<b>${partnerName || 'พาร์ทเนอร์'}</b><br/>อัปเดตล่าสุด: ${new Date(last.created_at).toLocaleTimeString('th-TH')}`);
    }

    if (locs.length > 1) {
      const path = locs.map(l => [l.latitude, l.longitude] as [number, number]);
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(path);
      } else {
        polylineRef.current = L.polyline(path, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 8',
        }).addTo(map);
      }
    }

    map.panTo([last.latitude, last.longitude], { animate: true });
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 animate-pulse space-y-4">
            <div className="w-2/3 h-6 bg-primary/20 rounded" />
            <div className="w-full h-64 bg-primary/20 rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!booking) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-tmain font-medium">ไม่พบรายการจอง</p>
          <Link href="/booking" className="text-secondary font-medium mt-2 inline-block">กลับรายการจอง</Link>
        </div>
      </AppLayout>
    );
  }

  const lastLocation = locations[locations.length - 1];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <Link href={`/booking/${bookingId}`} className="flex items-center gap-1 text-tmuted mb-4 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition w-fit">
          <ArrowLeft size={18} /> กลับรายละเอียด
        </Link>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-primary-dark/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-tmain flex items-center gap-2">
                  <Navigation size={20} className="text-secondary" />
                  GPS Tracking
                </h1>
                <p className="text-sm text-tmuted">{booking.post?.title}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {isInProgress ? (
                  <span className="flex items-center gap-1 bg-success/20 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    <Radio size={12} className="animate-pulse" /> กำลังติดตาม
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-primary-dark/20 text-tmuted px-3 py-1 rounded-full text-xs font-medium">
                    <WifiOff size={12} /> หยุดแล้ว
                  </span>
                )}
              </div>
            </div>

            {isPartner && isInProgress && (
              <div className="bg-success/10 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Wifi size={16} className={geo.tracking ? 'animate-pulse' : ''} />
                  <span>
                    {geo.tracking
                      ? `กำลังส่งตำแหน่ง — ${geo.accuracy ? `ความแม่นยำ ${Math.round(geo.accuracy)} เมตร` : 'กำลังดึงตำแหน่ง...'}`
                      : geo.error || 'กำลังเริ่ม GPS...'}
                  </span>
                </div>
                {geo.lastSent && (
                  <p className="text-xs text-green-600 mt-1 ml-7">ส่งล่าสุด: {new Date(geo.lastSent).toLocaleTimeString('th-TH')}</p>
                )}
              </div>
            )}

            {geo.error && isPartner && (
              <div className="bg-red-50 rounded-xl p-3 mb-3">
                <p className="text-sm text-red-600">{geo.error}</p>
                <p className="text-xs text-red-500 mt-1">ตรวจสอบว่าเปิด Location ในอุปกรณ์แล้ว และอนุญาตเว็บไซต์เข้าถึงตำแหน่ง</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
            <div
              ref={mapRef}
              className="w-full h-[400px] md:h-[500px]"
              style={{ background: '#e8f0e8' }}
            />
          </div>

          {lastLocation && (
            <div className="bg-white rounded-2xl border border-primary-dark/20 p-5">
              <h2 className="font-bold text-tmain mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-secondary" />
                ตำแหน่งล่าสุด
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary-light rounded-xl p-3">
                  <p className="text-xs text-tmuted">พาร์ทเนอร์</p>
                  <p className="text-sm font-medium text-tmain">{partnerName}</p>
                </div>
                <div className="bg-primary-light rounded-xl p-3">
                  <p className="text-xs text-tmuted">อัปเดตล่าสุด</p>
                  <p className="text-sm font-medium text-tmain flex items-center gap-1">
                    <Clock size={12} /> {getTimeAgo(lastLocation.created_at)}
                  </p>
                </div>
                <div className="bg-primary-light rounded-xl p-3">
                  <p className="text-xs text-tmuted">พิกัด</p>
                  <p className="text-sm font-medium text-tmain">{lastLocation.latitude.toFixed(5)}, {lastLocation.longitude.toFixed(5)}</p>
                </div>
                <div className="bg-primary-light rounded-xl p-3">
                  <p className="text-xs text-tmuted">จำนวนจุดที่บันทึก</p>
                  <p className="text-sm font-medium text-tmain">{locations.length} จุด</p>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full bg-primary hover:bg-primary-dark text-tmain font-medium py-2.5 rounded-xl text-sm text-center flex items-center justify-center gap-1.5 transition"
              >
                <Navigation size={16} /> เปิดใน Google Maps
              </a>
            </div>
          )}

          {!lastLocation && !isPartner && isInProgress && (
            <div className="bg-white rounded-2xl border border-primary-dark/20 p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin size={28} className="text-tmuted" />
              </div>
              <p className="text-tmain font-medium">รอข้อมูลตำแหน่ง</p>
              <p className="text-sm text-tmuted mt-1">ตำแหน่งจะแสดงเมื่อพาร์ทเนอร์เปิด GPS</p>
            </div>
          )}

          {!isInProgress && locations.length > 0 && (
            <div className="bg-primary-light rounded-xl p-4 text-center">
              <p className="text-sm text-tmuted">งานเสร็จสิ้นแล้ว — แสดงเส้นทางที่บันทึกไว้ทั้งหมด {locations.length} จุด</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
