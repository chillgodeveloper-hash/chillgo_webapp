'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { checkContentViolation, validateFile } from '@/lib/moderation';
import { ImagePlus, Video, X, Send, AlertTriangle } from 'lucide-react';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

export default function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<{ file: File; type: 'image' | 'video'; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [violation, setViolation] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
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

      if (!validation.valid) {
        setError(validation.error || '');
        continue;
      }

      newFiles.push({
        file,
        type: isVideo ? 'video' : 'image',
        preview: URL.createObjectURL(file),
      });
    }

    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

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
      const mediaUrls: string[] = [];
      const mediaTypes: ('image' | 'video')[] = [];

      for (const { file, type } of files) {
        const ext = file.name.split('.').pop();
        const path = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        mediaUrls.push(publicUrl);
        mediaTypes.push(type);
      }

      const { error: postError } = await supabase.from('posts').insert({
        partner_id: partnerProfile.id,
        title,
        content,
        media_urls: mediaUrls,
        media_types: mediaTypes,
        category: partnerProfile.category,
        price_min: priceMin ? parseFloat(priceMin) : null,
        price_max: priceMax ? parseFloat(priceMax) : null,
        location: location || null,
        status: 'active',
      });

      if (postError) throw postError;

      setTitle('');
      setContent('');
      setPriceMin('');
      setPriceMax('');
      setLocation('');
      setFiles([]);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-primary-dark/20 p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm">
          {user?.full_name?.charAt(0)}
        </div>
        <p className="font-semibold text-tmain">{partnerProfile?.business_name}</p>
      </div>

      {violation && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={18} className="text-danger mt-0.5 flex-shrink-0" />
          <p className="text-sm text-danger">{violation}</p>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="ชื่อบริการ / หัวข้อโพสต์"
        className="w-full px-3 py-2 text-lg font-semibold border-0 border-b border-primary-dark/15 focus:border-primary outline-none mb-3"
        required
      />

      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="รายละเอียดบริการ..."
        rows={4}
        className="w-full px-3 py-2 border-0 outline-none resize-none text-tmain"
        required
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-tmuted mb-1 block">ราคาเริ่มต้น (฿)</label>
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-tmuted mb-1 block">ราคาสูงสุด (฿)</label>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm"
          />
        </div>
      </div>

      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="📍 สถานที่ (ไม่บังคับ)"
        className="w-full px-3 py-2 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm mb-4"
      />

      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {files.map((f, i) => (
            <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-primary/20">
              {f.type === 'image' ? (
                <img src={f.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={f.preview} className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-primary-light"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-primary-dark/15">
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-tmuted hover:bg-primary/20 transition"
          >
            <ImagePlus size={18} /> รูป/คลิป
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !!violation || !title || !content}
          className="bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold px-6 py-2 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" />
          ) : (
            <>
              <Send size={16} /> โพสต์
            </>
          )}
        </button>
      </div>
    </form>
  );
}
