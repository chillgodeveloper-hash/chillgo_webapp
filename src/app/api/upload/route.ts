import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

const ALLOWED_FOLDERS = new Set(['uploads', 'posts', 'avatars', 'portfolio', 'chat']);
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov']);

function sanitizeExt(name: string): string | null {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!/^[a-z0-9]{2,5}$/.test(ext)) return null;
  if (!ALLOWED_EXTS.has(ext)) return null;
  return ext;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderInput = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Allowlist folders — prevent path traversal / arbitrary prefixes
    if (!ALLOWED_FOLDERS.has(folderInput)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    const isImage = IMAGE_MIMES.has(file.type);
    const isVideo = VIDEO_MIMES.has(file.type);
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const ext = sanitizeExt(file.name);
    if (!ext) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
    }

    const path = `${folderInput}/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
