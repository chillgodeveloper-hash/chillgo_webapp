'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { checkContentViolation, validateFile } from '@/lib/moderation';
import { ImagePlus, X, Send, AlertTriangle, Link2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [locationName, setLocationName] = useState(existingLocation.split(' — ')[0] || existingLocation);
  const [googleMapsLink, setGoogleMapsLink] = useState(editPost?.google_maps_link || '');
  const [files, setFiles] = useState<{ file: File; type: 'image' | 'video'; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [violation, setViolation] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, partnerProfile } = useAuthStore();
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles: typeof files = [];
    const rejected: string[] = [];
    for (const file of selected) {
      const isVideo = file.type.startsWith('video/');
      const v = validateFile(file, isVideo ? 'video' : 'image');
      if (!v.valid) {
        rejected.push(`${file.name}: ${v.error}`);
        continue;
      }
      newFiles.push({ file, type: isVideo ? 'video' : 'image', preview: URL.createObjectURL(file) });
    }
    if (rejected.length > 0) {
      setFileError(rejected.join('\n'));
    }
    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (i: number) => {
    setFiles((prev) => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
  };

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

      const finalLocation = locationName || null;
      const postData: any = {
        title, content, media_urls: mediaUrls, media_types: mediaTypes,
        category: partnerProfile.category,
        price_min: price ? parseFloat(price) : null,
        price_max: price ? parseFloat(price) : null,
        location: finalLocation || null, status: 'active',
        google_maps_link: googleMapsLink || null,
      };

      if (editPost) {
        await supabase.from('posts').update(postData).eq('id', editPost.id);
      } else {
        await supabase.from('posts').insert({ ...postData, partner_id: partnerProfile.id });
      }

      setTitle(''); setContent(''); setPrice(''); setLocationName(''); setGoogleMapsLink(''); setFiles([]);
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

      <textarea value={content} onChange={(e) => { setContent(e.target.value); const c = checkContentViolation(e.target.value); setViolation(c.isViolation ? (c.reason || '') : ''); }} placeholder="รายละเอียดบริการ..." rows={8} className="w-full min-w-0 px-3 py-2 border border-primary-dark/15 rounded-xl outline-none resize-y text-tmain bg-transparent mb-3 focus:border-primary focus:ring-2 focus:ring-primary/20" required />

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
        <label className="text-xs text-tmuted mb-1 block">ลิงก์ Google Maps</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tmuted" />
            <input type="url" value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className="w-full min-w-0 h-12 pl-9 pr-3 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm text-tmain" />
          </div>
        </div>
      </div>

      {(files.length > 0 || editPost?.media_urls?.length > 0) && (() => {
        const existing: { url: string; type: 'image' | 'video' }[] = (editPost?.media_urls || []).map((url: string, i: number) => ({
          url, type: editPost.media_types?.[i] === 'video' ? 'video' : 'image',
        }));
        const news = files.map((f) => ({ url: f.preview, type: f.type }));
        const combined = [...existing, ...news];
        return (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {existing.map((m, i) => (
              <button
                key={`e-${i}`}
                type="button"
                onClick={() => setLightboxIdx(i)}
                className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-primary/10 cursor-zoom-in"
              >
                {m.type === 'video' ? (
                  <>
                    <video src={m.url} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs">▶</span>
                  </>
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
            {files.map((f, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-primary/10">
                <button
                  type="button"
                  onClick={() => setLightboxIdx(existing.length + i)}
                  className="block w-full h-full cursor-zoom-in"
                >
                  {f.type === 'image' ? (
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video src={f.preview} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs">▶</span>
                    </>
                  )}
                </button>
                <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-primary-light"><X size={12} /></button>
              </div>
            ))}
            {lightboxIdx !== null && combined[lightboxIdx] && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center z-10"
                >
                  <X size={20} />
                </button>
                {combined.length > 1 && lightboxIdx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center z-10"
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}
                {combined.length > 1 && lightboxIdx < combined.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center z-10"
                  >
                    <ChevronRight size={22} />
                  </button>
                )}
                <div className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  {combined[lightboxIdx].type === 'video' ? (
                    <video src={combined[lightboxIdx].url} controls autoPlay className="max-w-[92vw] max-h-[88vh]" />
                  ) : (
                    <img src={combined[lightboxIdx].url} alt="" className="max-w-[92vw] max-h-[88vh] object-contain" />
                  )}
                </div>
                {combined.length > 1 && (
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
                    {lightboxIdx + 1} / {combined.length}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div className="flex items-center justify-between pt-3 border-t border-primary-dark/15">
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onChange={handleFileSelect} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-tmuted hover:bg-primary/20 transition">
            <ImagePlus size={18} /> รูป/คลิป
          </button>
        </div>
        <button type="submit" disabled={loading || !!violation || !title || !content} className="bg-primary hover:bg-primary-dark text-tmain font-semibold px-6 py-2 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-40">
          {loading ? <div className="w-4 h-4 border-2 border-tmain/30 border-t-tmain rounded-full animate-spin" /> : <><Send size={16} /> {editPost ? 'บันทึก' : 'โพสต์'}</>}
        </button>
      </div>

      {fileError && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFileError(null)} />
          <div className="relative bg-white w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-xl animate-blur-in">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-danger/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-danger" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-tmain mb-1">ไฟล์ไม่ถูกต้อง</h3>
                  <p className="text-sm text-tmuted">รูปไม่เกิน 5MB · คลิปไม่เกิน 50MB</p>
                </div>
                <button type="button" onClick={() => setFileError(null)} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-tmain hover:bg-primary/30 transition flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
              <div className="bg-danger/5 border border-danger/20 rounded-xl px-3 py-2.5 text-sm text-tmain whitespace-pre-line break-words max-h-40 overflow-y-auto">
                {fileError}
              </div>
              <button type="button" onClick={() => setFileError(null)} className="w-full mt-4 bg-primary hover:bg-primary-dark text-tmain font-semibold py-2.5 rounded-xl text-sm transition">
                เข้าใจแล้ว
              </button>
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
        <p className="font-semibold text-tmain">{editPost ? 'แก้ไขโพสต์' : 'สร้างโพสต์ใหม่'}</p>
        {editPost && <button type="button" onClick={onCancelEdit} className="text-sm text-tmuted hover:bg-primary/20 px-3 py-1 rounded-lg transition">ยกเลิก</button>}
      </div>
      {formBody}
    </form>
  );
}
