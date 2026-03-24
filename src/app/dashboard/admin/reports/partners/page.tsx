'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Users } from 'lucide-react';

export default function PartnersReportPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">รายงานพาร์ทเนอร์</h1>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <Users size={48} className="text-secondary mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">รายงานพาร์ทเนอร์</h2>
          <p className="text-gray-500 text-sm">
            ระบบรายงานจะพร้อมใช้งานเร็ว ๆ นี้ สามารถดูข้อมูลเบื้องต้นได้ที่หน้า Dashboard
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
