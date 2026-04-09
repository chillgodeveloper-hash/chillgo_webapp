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
  wakeLockActive: boolean;
}

export function useGeoTracking({ bookingId, userId, enabled, intervalMs = 10000 }: GeoTrackingOptions) {
  const [state, setState] = useState<GeoState>({
    tracking: false,
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    lastSent: null,
    wakeLockActive: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestCoordsRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const wakeLockRef = useRef<any>(null);
  const supabase = createClient();

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setState(prev => ({ ...prev, wakeLockActive: true }));

        wakeLockRef.current.addEventListener('release', () => {
          setState(prev => ({ ...prev, wakeLockActive: false }));
        });
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setState(prev => ({ ...prev, wakeLockActive: false }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && enabled && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [enabled, requestWakeLock]);

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

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'เบราว์เซอร์ไม่รองรับ GPS' }));
      return;
    }

    await requestWakeLock();

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
  }, [sendLocation, intervalMs, requestWakeLock]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    await releaseWakeLock();
    setState(prev => ({ ...prev, tracking: false }));
  }, [releaseWakeLock]);

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
