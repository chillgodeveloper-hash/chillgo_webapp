'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Settings, Shield, Bell, Database, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 lg:px-0">
        <h1 className="text-2xl font-bold text-tmain mb-6">ตั้งค่าระบบ</h1>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-primary-dark/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Globe size={20} className="text-primary-text" />
              </div>
              <div>
                <h3 className="font-semibold text-tmain">ตั้งค่าทั่วไป</h3>
                <p className="text-sm text-tmuted">ชื่อแพลตฟอร์ม ภาษา</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-tmuted block mb-1">ชื่อแพลตฟอร์ม</label>
                <input
                  type="text"
                  defaultValue="#ChillGo"
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-dark/30 focus:border-primary outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-primary-dark/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-tmain">ความปลอดภัย</h3>
                <p className="text-sm text-tmuted">การตั้งค่า content moderation</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-tmain">บล็อกช่องทางติดต่อภายนอก</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary rounded" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-tmain">จำกัดขนาดไฟล์อัปโหลด</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary rounded" />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-primary-dark/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Database size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-tmain">ฐานข้อมูล</h3>
                <p className="text-sm text-tmuted">Supabase connection</p>
              </div>
            </div>
            <p className="text-sm text-success bg-success/10 rounded-xl p-3">✓ เชื่อมต่อสำเร็จ</p>
          </div>

          <button className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-semibold py-3 rounded-2xl transition">
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
