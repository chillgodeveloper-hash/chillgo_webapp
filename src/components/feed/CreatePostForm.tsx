'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { checkContentViolation, validateFile } from '@/lib/moderation';
import { ImagePlus, X, Send, AlertTriangle, MapPin, Calendar, Globe } from 'lucide-react';

interface CreatePostFormProps {
  onSuccess?: () => void;
  editPost?: any;
  onCancelEdit?: () => void;
}

export default function CreatePostForm({ onSuccess, editPost, onCancelEdit }: CreatePostFormProps) {
  const [title, setTitle] = useState(editPost?.title || '');
  const [content, setContent] = useState(editPost?.content || '');
  const [price, setPrice] = useState(editPost?.price_min?.toString() || '');
  const [location, setLocation] = useState(editPost?.location || '');
  const [lat, setLat] = useState<number | null>(editPost?.lat || null);
  const [lng, setLng] = useState<number | null>(editPost?.lng || null);
  const [showMap, setShowMap] = useState(false);
  const [dateType, setDateType] = useState<'all_year' | 'range'>(editPost?.available_start ? 'range' : 'all_year');
  const [dateStart, setDateStart] = useState(editPost?.available_start || '');
  const [dateEnd, setDateEnd] = useState(editPost?.available_end || '');
  const [files, setFiles] = useState<{ file: File; type: 'image' | 'video'; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [violation, setViolation] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const { user, partnerProfile } = useAuthStore();
  const supabase = createClient();

  const handleContentChange = (text: string) => {
    setContent(text);
    const check = checkContentViolation(text);
    setViolation(check.reason || '');
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    const check = checkContentViolation(text);
    if (check.isViolation) setViolation(check.reason || '');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: typeof files = [];
    for (const file of selectedFiles) {
      const isVideo = file.type.startsWith('video/');
      const validation = validateFile(file, isVideo ? 'video' : 'image');
      if (!validation.valid) { setError(validation.error || ''); continue; }
      newFiles.push({ file, type: isVideo ? 'video' : 'image', preview: URL.createObjectURL(file) });
    }
    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => { URL.revokeObjectURL(prev[index].preview); return prev.filter((_, i) => i !== index); });
  };

  useEffect(() => {
    if (!showMap || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const defaultLat = lat || 13.7563;
    const defaultLng = lng || 100.5018;
    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], lat ? 14 : 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    let marker = lat ? L.marker([lat, lng]).addTo(map) : null;

    map.on('click', (e: any) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      setLat(newLat);
      setLng(newLng);
      if (marker) map.removeLayer(marker);
      marker = L.marker([newLat, newLng]).addTo(map);

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&accept-language=th`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            const short = data.address?.city || data.address?.town || data.address?.state || data.display_name.split(',').slice(0, 2).join(',');
            setLocation(short);
          }
        })
        .catch(() => {});
    });

    return () => { map.remove(); };
  }, [showMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !partnerProfile) return;
    const titleCheck = checkContentViolation(title);
    const contentCheck = checkContentViolation(content);
    if (titleCheck.isViolation || contentCheck.isViolation) {
      setViolation(titleCheck.reason || contentCheck.reason || '');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let mediaUrls = editPost?.media_urls || [];
      let mediaTypes = editPost?.media_types || [];

      for (const { file, type } of files) {
        const ext = file.name.split('.').pop();
        const path = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        mediaUrls = [...mediaUrls, publicUrl];
        mediaTypes = [...mediaTypes, type];
      }

      const postData = {
        title,
        content,
        media_urls: mediaUrls,
        media_types: mediaTypes,
        category: partnerProfile.category,
        price_min: price ? parseFloat(price) : null,
        price_max: price ? parseFloat(price) : null,
        location: location || null,
        lat: lat || null,
        lng: lng || null,
        available_start: dateType === 'range' ? dateStart || null : null,
        available_end: dateType === 'range' ? dateEnd || null : null,
        status: 'active',
      };

      if (editPost) {
        await supabase.from('posts').update(postData).eq('id', editPost.id);
      } else {
        await supabase.from('posts').insert({ ...postData, partner_id: partnerProfile.id });
      }

      setTitle(''); setContent(''); setPrice(''); setLocation('');
      setLat(null); setLng(null); setDateType('all_year');
      setDateStart(''); setDateEnd(''); setFiles([]);
      onSuccess?.();
      onCancelEdit?.();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-primary-dark/20 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
            <p className="font-semibold text-tmain">{editPost ? 'แก้ไขโพสต์' : 'สร้างโพสต์ใหม่'}</p>
          </div>
          {editPost && (
            <button type="button" onClick={onCancelEdit} className="text-sm text-tmuted hover:bg-primary/20 px-3 py-1 rounded-lg transition">ยกเลิก</button>
          )}
        </div>

        {violation && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertTriangle size={18} className="text-danger mt-0.5 flex-shrink-0" />
            <p className="text-sm text-tmain">{violation}</p>
          </div>
        )}
        {error && <div className="bg-danger/10 border border-danger/20 text-tmain rounded-xl p-3 mb-4 text-sm">{error}</div>}

        <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="ชื่อบริการ / หัวข้อโพสต์" className="w-full min-w-0 h-12 px-3 text-lg font-semibold border-0 border-b border-primary-dark/15 focus:border-primary outline-none mb-3 text-tmain" required />

        <textarea value={content} onChange={(e) => handleContentChange(e.target.value)} placeholder="รายละเอียดบริการ..." rows={4} className="w-full min-w-0 px-3 py-2 border-0 outline-none resize-none text-tmain" required />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-tmuted mb-1 block">ราคา (฿)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm text-tmain" />
          </div>
          <div>
            <label className="text-xs text-tmuted mb-1 block">สถานที่</label>
            <div className="relative">
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="กดเลือกจากแผนที่" className="w-full min-w-0 h-12 pl-3 pr-10 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm text-tmain" readOnly onClick={() => setShowMap(true)} />
              <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-tmuted cursor-pointer" onClick={() => setShowMap(true)} />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-tmuted mb-2 block flex items-center gap-1"><Calendar size={12} /> ช่วงเวลาให้บริการ</label>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setDateType('all_year')} className={`px-4 h-10 rounded-lg text-sm font-medium transition ${dateType === 'all_year' ? 'bg-secondary text-tmain' : 'bg-primary/20 text-tmain hover:bg-primary/30'}`}>
              <Globe size={14} className="inline mr-1" /> ตลอดทั้งปี
            </button>
            <button type="button" onClick={() => setDateType('range')} className={`px-4 h-10 rounded-lg text-sm font-medium transition ${dateType === 'range' ? 'bg-secondary text-tmain' : 'bg-primary/20 text-tmain hover:bg-primary/30'}`}>
              <Calendar size={14} className="inline mr-1" /> กำหนดช่วงเวลา
            </button>
          </div>
          {dateType === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-tmuted mb-1 block">วันเริ่มต้น</label>
                <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm text-tmain" />
              </div>
              <div>
                <label className="text-xs text-tmuted mb-1 block">วันสิ้นสุด</label>
                <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} min={dateStart} className="w-full min-w-0 h-12 px-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm text-tmain" />
              </div>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {files.map((f, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-primary/10">
                {f.type === 'image' ? <img src={f.preview} alt="" className="w-full h-full object-cover" /> : <video src={f.preview} className="w-full h-full object-cover" />}
                <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-primary-light"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-primary-dark/15">
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={handleFileSelect} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-tmuted hover:bg-primary/20 transition">
              <ImagePlus size={18} /> รูป/คลิป
            </button>
          </div>
          <button type="submit" disabled={loading || !!violation || !title || !content} className="bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-40">
            {loading ? <div className="w-4 h-4 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><Send size={16} /> {editPost ? 'บันทึก' : 'โพสต์'}</>}
          </button>
        </div>
      </form>

      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMap(false)} />
          <div className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-primary-dark/15 flex items-center justify-between">
              <h3 className="font-bold text-tmain">เลือกสถานที่</h3>
              <button onClick={() => setShowMap(false)} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-tmain"><X size={18} /></button>
            </div>
            <div ref={mapRef} className="w-full h-[400px]" />
            <div className="p-4 flex items-center justify-between">
              <p className="text-sm text-tmuted">{location || 'กดบนแผนที่เพื่อเลือกตำแหน่ง'}</p>
              <button onClick={() => setShowMap(false)} className="bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2 rounded-xl text-sm transition">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
