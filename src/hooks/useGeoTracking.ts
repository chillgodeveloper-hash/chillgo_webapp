'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';

interface GeoTrackingOptions {
  bookingId: string;
  userId: string;
  enabled: boolean;
  intervalMs?: number;
}

interface GeoState {
  tracking: boolean;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  lastSent: string | null;
}

export function useGeoTracking({ bookingId, userId, enabled, intervalMs = 30000 }: GeoTrackingOptions) {
  const [state, setState] = useState<GeoState>({
    tracking: false,
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    lastSent: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestCoordsRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const supabase = createClient();

  const sendLocation = useCallback(async () => {
    const coords = latestCoordsRef.current;
    if (!coords || !bookingId || !userId) return;

    const { error } = await supabase.from('booking_locations').insert({
      booking_id: bookingId,
      user_id: userId,
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy: coords.accuracy,
    });

    if (!error) {
      setState(prev => ({ ...prev, lastSent: new Date().toISOString() }));
    }
  }, [bookingId, userId]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'เบราว์เซอร์ไม่รองรับ GPS' }));
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        latestCoordsRef.current = { lat: latitude, lng: longitude, accuracy: accuracy || 0 };
        setState(prev => ({
          ...prev,
          tracking: true,
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 0,
          error: null,
        }));
      },
      (err) => {
        let msg = 'ไม่สามารถดึงตำแหน่งได้';
        if (err.code === 1) msg = 'กรุณาอนุญาตการเข้าถึงตำแหน่ง';
        if (err.code === 2) msg = 'ไม่พบสัญญาณ GPS';
        if (err.code === 3) msg = 'หมดเวลาดึงตำแหน่ง';
        setState(prev => ({ ...prev, error: msg, tracking: false }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    sendLocation();
    intervalRef.current = setInterval(sendLocation, intervalMs);
  }, [sendLocation, intervalMs]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, tracking: false }));
  }, []);

  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => { stopTracking(); };
  }, [enabled, startTracking, stopTracking]);

  return { ...state, stopTracking };
}
