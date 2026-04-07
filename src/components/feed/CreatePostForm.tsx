'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { checkContentViolation, validateFile } from '@/lib/moderation';
import { ImagePlus, X, Send, AlertTriangle, MapPin } from 'lucide-react';

interface Props {
  onSuccess?: () => void;
  editPost?: any;
  onCancelEdit?: () => void;
  isModal?: boolean;
}

export default function CreatePostForm({ onSuccess, editPost, onCancelEdit, isModal }: Props) {
  const existingLocation = editPost?.location || '';
  const [title, setTitle] = useState(editPost?.title || '');
  const [content, setContent] = useState(editPost?.content || '');
  const [price, setPrice] = useState(editPost?.price_min?.toString() || '');
  const [locationName, setLocationName] = useState(existingLocation.split(' — ')[0] || '');
  const [mapLocation, setMapLocation] = useState(existingLocation.split(' — ')[1] || '');
  const [showMap, setShowMap] = useState(false);
  const [files, setFiles] = useState<{ file: File; type: 'image' | 'video'; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [violation, setViolation] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const { user, partnerProfile } = useAuthStore();
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles: typeof files = [];
    for (const file of selected) {
      const isVideo = file.type.startsWith('video/');
      const v = validateFile(file, isVideo ? 'video' : 'image');
      if (!v.valid) { setError(v.error || ''); continue; }
      newFiles.push({ file, type: isVideo ? 'video' : 'image', preview: URL.createObjectURL(file) });
    }
    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (i: number) => {
    setFiles((prev) => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
  };

  useEffect(() => {
    if (!showMap || !mapRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;
      const map = L.map(mapRef.current).setView([13.7563, 100.5018], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
      let marker: any = null;
      map.on('click', (e: any) => {
        if (marker) map.removeLayer(marker);
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        setMapLocation(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      });
    };
    document.head.appendChild(script);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, [showMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !partnerProfile) return;
    const tc = checkContentViolation(title);
    const cc = checkContentViolation(content);
    if (tc.isViolation || cc.isViolation) { setViolation(tc.reason || cc.reason || ''); return; }
    setLoading(true);
    setError('');

    try {
      let mediaUrls = editPost?.media_urls || [];
      let mediaTypes = editPost?.media_types || [];
      for (const { file, type } of files) {
        const ext = file.name.split('.').pop();
        const path = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: ue } = await supabase.storage.from('media').upload(path, file);
        if (ue) throw ue;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        mediaUrls = [...mediaUrls, publicUrl];
        mediaTypes = [...mediaTypes, type];
      }

      const finalLocation = [locationName, mapLocation].filter(Boolean).join(' — ');
      const postData: any = {
        title, content, media_urls: mediaUrls, media_types: mediaTypes,
        category: partnerProfile.category,
        price_min: price ? parseFloat(price) : null,
        price_max: price ? parseFloat(price) : null,
        location: finalLocation || null, status: 'active',
      };

      if (editPost) {
        await supabase.from('posts').update(postData).eq('id', editPost.id);
      } else {
        await supabase.from('posts').insert({ ...postData, partner_id: partnerProfile.id });
      }

      setTitle(''); setContent(''); setPrice(''); setLocationName(''); setMapLocation(''); setFiles([]);
      onSuccess?.();
      if (isModal) onCancelEdit?.();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const formBody = (
    <>
      {violation && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={18} className="text-danger mt-0.5 flex-shrink-0" />
          <p className="text-sm text-tmain">{violation}</p>
        </div>
      )}
      {error && <div className="bg-danger/10 border border-danger/20 text-tmain rounded-xl p-3 mb-4 text-sm">{error}</div>}

      <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); const c = checkContentViolation(e.target.value); setViolation(c.isViolation ? (c.reason || '') : ''); }} placeholder="ชื่อบริการ / หัวข้อโพสต์" className="w-full min-w-0 h-12 px-3 text-lg font-semibold border-0 border-b border-primary-dark/15 focus:border-primary outline-none mb-3 text-tmain bg-transparent" required />

      <textarea value={content} onChange={(e) => { setContent(e.target.value); const c = checkContentViolation(e.target.value); setViolation(c.isViolation ? (c.reason || '') : ''); }} placeholder="รายละเอียดบริการ..." rows={3} className="w-full min-w-0 px-3 py-2 border-0 outline-none resize-none text-tmain bg-transparent mb-3" required />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-tmuted mb-1 block">ราคา (฿)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm text-tmain" />
        </div>
        <div>
          <label className="text-xs text-tmuted mb-1 block">ชื่อสถานที่</label>
          <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="เช่น เชียงใหม่, ภูเก็ต" className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm text-tmain" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-tmuted mb-1 block">ตำแหน่งบนแผนที่</label>
        <div className="flex gap-2">
          <input type="text" value={mapLocation} readOnly placeholder="กดเลือกจากแผนที่" className="flex-1 min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 text-sm text-tmain bg-primary-light/50" />
          <button type="button" onClick={() => setShowMap(true)} className="h-12 px-4 bg-primary/20 hover:bg-primary/30 rounded-xl text-sm text-tmain font-medium transition flex items-center gap-1.5">
            <MapPin size={16} /> เลือก
          </button>
        </div>
      </div>

      {(files.length > 0 || editPost?.media_urls?.length > 0) && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {editPost?.media_urls?.map((url: string, i: number) => (
            <div key={`e-${i}`} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-primary/10">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {files.map((f, i) => (
            <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-primary/10">
              {f.type === 'image' ? <img src={f.preview} alt="" className="w-full h-full object-cover" /> : <video src={f.preview} className="w-full h-full object-cover" />}
              <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-primary-light"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-primary-dark/15">
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={handleFileSelect} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-tmuted hover:bg-primary/20 transition">
            <ImagePlus size={18} /> รูป/คลิป
          </button>
        </div>
        <button type="submit" disabled={loading || !!violation || !title || !content} className="bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-40">
          {loading ? <div className="w-4 h-4 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><Send size={16} /> {editPost ? 'บันทึกการเปลี่ยนแปลง' : 'โพสต์'}</>}
        </button>
      </div>

      {showMap && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMap(false)} />
          <div className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-primary-dark/15 flex items-center justify-between">
              <h3 className="font-bold text-tmain">เลือกตำแหน่งสถานที่</h3>
              <button type="button" onClick={() => setShowMap(false)} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-tmain"><X size={18} /></button>
            </div>
            <div ref={mapRef} className="w-full h-[400px]" />
            <div className="p-4 flex items-center justify-between">
              <p className="text-sm text-tmuted">{mapLocation || 'กดบนแผนที่เพื่อเลือกตำแหน่ง'}</p>
              <button type="button" onClick={() => setShowMap(false)} className="bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2 rounded-xl text-sm transition">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isModal) return <form onSubmit={handleSubmit}>{formBody}</form>;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-primary-dark/20 p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm">{user?.full_name?.charAt(0)}</div>
          <p className="font-semibold text-tmain">{editPost ? 'แก้ไขโพสต์' : 'สร้างโพสต์ใหม่'}</p>
        </div>
        {editPost && <button type="button" onClick={onCancelEdit} className="text-sm text-tmuted hover:bg-primary/20 px-3 py-1 rounded-lg transition">ยกเลิก</button>}
      </div>
      {formBody}
    </form>
  );
}
