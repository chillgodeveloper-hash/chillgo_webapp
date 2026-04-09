import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ChillGo Travel - จัดทริปง่าย ๆ สไตล์คุณ',
  description: 'แพลตฟอร์มจองไกด์และรถเช่าสำหรับทริปในฝัน',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-primary-light overflow-x-hidden">{children}</body>
    </html>
  );
}
