import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-primary-dark/20 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <img src="/logo.png" alt="ChillGo" className="h-12 w-auto mb-2" />
            <p className="text-sm text-tmuted">จัดทริปง่าย ๆ สไตล์คุณ</p>
          </div>
          <div>
            <h4 className="font-semibold text-tmain mb-3 text-sm">บริการ</h4>
            <div className="space-y-2">
              <Link href="/feed?category=guide" className="block text-sm text-tmuted hover:bg-primary/20 px-2 py-1 rounded transition">ไกด์ท่องเที่ยว</Link>
              <Link href="/feed?category=driver" className="block text-sm text-tmuted hover:bg-primary/20 px-2 py-1 rounded transition">คนขับรถ</Link>
              <Link href="/feed?category=translator" className="block text-sm text-tmuted hover:bg-primary/20 px-2 py-1 rounded transition">ล่าม / นักแปล</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-tmain mb-3 text-sm">เกี่ยวกับ</h4>
            <div className="space-y-2">
              <span className="block text-sm text-tmuted px-2 py-1">เกี่ยวกับเรา</span>
              <span className="block text-sm text-tmuted px-2 py-1">ข้อกำหนดการใช้งาน</span>
              <span className="block text-sm text-tmuted px-2 py-1">นโยบายความเป็นส่วนตัว</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-tmain mb-3 text-sm">ติดต่อ</h4>
            <div className="space-y-2">
              <span className="block text-sm text-tmuted px-2 py-1">support@chillgo.com</span>
              <span className="block text-sm text-tmuted px-2 py-1">Line: @chillgo</span>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-dark/10 mt-6 pt-6 text-center">
          <p className="text-xs text-tmuted">&copy; 2025 ChillGo Travel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
