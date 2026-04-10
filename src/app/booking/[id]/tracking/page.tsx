'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useGeoTracking } from '@/hooks/useGeoTracking';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Clock, Wifi, WifiOff, Radio, ExternalLink, Smartphone, CheckCircle } from 'lucide-react';

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
}

function LeafletMap({ locations, partnerName, onMapReady }: { locations: LocationPoint[]; partnerName: string; onMapReady?: (centerFn: () => void) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const polylineInstanceRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  const initMap = useCallback(() => {
    const Leaf = (window as any).L;
    if (!Leaf || !containerRef.current || mapInstanceRef.current) return;

    const last = locations[locations.length - 1];
    const center = last ? [last.latitude, last.longitude] : [13.7563, 100.5018];

    const map = Leaf.map(containerRef.current, {
      center,
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    Leaf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setLoaded(true);

    setTimeout(() => { map.invalidateSize(); }, 300);

    if (onMapReady) {
      onMapReady(() => {
        const m = markerInstanceRef.current;
        if (m && mapInstanceRef.current) {
          mapInstanceRef.current.setView(m.getLatLng(), 16, { animate: true });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      initMap();
      return;
    }

    const existingCss = document.getElementById('leaflet-cdn-css');
    if (!existingCss) {
      const css = document.createElement('link');
      css.id = 'leaflet-cdn-css';
      css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      css.crossOrigin = 'anonymous';
      document.head.appendChild(css);
    }

    const existingScript = document.getElementById('leaflet-cdn-js');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'leaflet-cdn-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => { initMap(); };
      document.head.appendChild(script);
    } else {
      const checkReady = setInterval(() => {
        if ((window as any).L) {
          clearInterval(checkReady);
          initMap();
        }
      }, 100);
      return () => clearInterval(checkReady);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        polylineInstanceRef.current = null;
      }
    };
  }, [initMap]);

  useEffect(() => {
    if (typeof window === 'undefined' || !loaded) return;
    const Leaf = (window as any).L;
    if (!Leaf || !mapInstanceRef.current || locations.length === 0) return;

    const map = mapInstanceRef.current;
    const last = locations[locations.length - 1];

    const icon = Leaf.divIcon({
      className: '',
      html: '<div style="width:40px;height:40px;background:#22c55e;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([last.latitude, last.longitude]);
      markerInstanceRef.current.setPopupContent(
        '<b>' + (partnerName || 'พาร์ทเนอร์') + '</b><br/>อัปเดต: ' + new Date(last.created_at).toLocaleTimeString('th-TH')
      );
    } else {
      markerInstanceRef.current = Leaf.marker([last.latitude, last.longitude], { icon })
        .addTo(map)
        .bindPopup('<b>' + (partnerName || 'พาร์ทเนอร์') + '</b><br/>อัปเดต: ' + new Date(last.created_at).toLocaleTimeString('th-TH'))
        .openPopup();
    }

    if (locations.length >= 2) {
      const path = locations.map((l: LocationPoint) => [l.latitude, l.longitude]);
      if (polylineInstanceRef.current) {
        polylineInstanceRef.current.setLatLngs(path);
      } else {
        polylineInstanceRef.current = Leaf.polyline(path, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 6',
        }).addTo(map);
      }
    }

    map.setView([last.latitude, last.longitude], map.getZoom(), { animate: true });

  }, [locations, partnerName, loaded]);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-primary-dark/20 bg-white">
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 1 }} />
      {loaded && locations.length > 0 && (
        <button
          onClick={() => {
            const m = markerInstanceRef.current;
            if (m && mapInstanceRef.current) {
              mapInstanceRef.current.setView(m.getLatLng(), 16, { animate: true });
            }
          }}
          className="absolute bottom-4 right-4 z-[1000] bg-white hover:bg-primary-light text-tmain w-10 h-10 rounded-full shadow-lg border border-primary-dark/20 flex items-center justify-center transition"
          title="กลับมาตำแหน่งปัจจุบัน"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}
      {!loaded && (
        <div className="absolute inset-0 bg-primary-light flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-10 h-10 border-[3px] border-primary-dark/30 border-t-secondary rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-tmuted">กำลังโหลดแผนที่...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  const { id: bookingId } = useParams();
  const { user } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const [booking, setBooking] = useState<any>(null);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState('');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState('');
  const [endingJob, setEndingJob] = useState(false);

  const isPartner = user?.role === 'partner' && booking?.partner_id === user?.id;
  const isInProgress = booking?.status === 'in_progress';

  const geo = useGeoTracking({
    bookingId: bookingId as string,
    userId: user?.id || '',
    enabled: isPartner && isInProgress,
    intervalMs: 10000,
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

        const { data: wh } = await supabase.from('work_history').select('started_at, completed_at').eq('booking_id', bookingId).maybeSingle();
        if (wh?.started_at) setStartedAt(wh.started_at);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!startedAt) return;

    const calcElapsed = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      if (h > 0) {
        setElapsed(`${h} ชม. ${m} นาที`);
      } else {
        setElapsed(`${m} นาที`);
      }
    };

    calcElapsed();
    const timer = setInterval(calcElapsed, 60000);
    return () => clearInterval(timer);
  }, [startedAt]);

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

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-6 animate-blur-in">
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

            {isPartner && isInProgress && (
              <div className="bg-success/10 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Wifi size={16} className={geo.tracking ? 'animate-pulse' : ''} />
                  <span>
                    {geo.tracking
                      ? `กำลังส่งตำแหน่ง — ${geo.accuracy ? `ความแม่นยำ ${Math.round(geo.accuracy)} ม.` : 'กำลังดึงตำแหน่ง...'}`
                      : geo.error || 'กำลังเริ่ม GPS...'}
                  </span>
                </div>
                {geo.lastSent && (
                  <p className="text-xs text-green-600 mt-1 ml-7">ส่งล่าสุด: {new Date(geo.lastSent).toLocaleTimeString('th-TH')}</p>
                )}
              </div>
            )}

            {isPartner && isInProgress && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                <div className="flex items-start gap-2">
                  <Smartphone size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">โปรดเปิดหน้าจอนี้ไว้</p>
                    <p className="text-xs text-amber-600 mt-0.5">เพื่อส่งตำแหน่งให้ลูกค้าอย่างต่อเนื่อง {geo.wakeLockActive ? '— หน้าจอจะไม่ดับอัตโนมัติ ✓' : ''}</p>
                  </div>
                </div>
              </div>
            )}

            {geo.error && isPartner && (
              <div className="bg-red-50 rounded-xl p-3 mt-3">
                <p className="text-sm text-red-600">{geo.error}</p>
                <p className="text-xs text-red-500 mt-1">ตรวจสอบว่าเปิด Location ในอุปกรณ์แล้ว และอนุญาตเว็บไซต์เข้าถึงตำแหน่ง</p>
              </div>
            )}
          </div>

          <LeafletMap locations={locations} partnerName={partnerName} />

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
                  <p className="text-xs text-tmuted">เวลาทำงาน</p>
                  <p className="text-sm font-medium text-tmain flex items-center gap-1">
                    <Clock size={12} /> {elapsed || '—'}
                  </p>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full bg-primary hover:bg-primary-dark text-tmain font-medium py-2.5 rounded-xl text-sm text-center flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink size={16} /> เปิดใน Google Maps
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

          {isPartner && isInProgress && (
            <button
              disabled={endingJob}
              onClick={async () => {
                if (!confirm('ยืนยันจบงาน?')) return;
                setEndingJob(true);
                try {
                  await geo.stopTracking();
                  await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
                  await supabase.from('work_history').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('booking_id', bookingId);
                  await supabase.from('notifications').insert({
                    user_id: booking.customer_id,
                    title: 'งานเสร็จสิ้น',
                    message: `งาน "${booking.post?.title}" เสร็จสิ้นแล้ว กรุณารีวิว`,
                    type: 'booking',
                    link: `/booking/${bookingId}`,
                  });
                  router.push(`/booking/${bookingId}`);
                } catch (err) {
                  console.error(err);
                  setEndingJob(false);
                }
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle size={18} /> {endingJob ? 'กำลังจบงาน...' : 'จบงาน'}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
