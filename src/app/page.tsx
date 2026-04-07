'use client';

import { Loader2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light">
      <div className="text-center">
        <Loader2 size={40} className="text-secondary animate-spin mx-auto mb-3" />
        <p className="text-tmuted">กำลังโหลด...</p>
      </div>
    </div>
  );
}
