'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { User, Mail, LogOut, ChevronRight, Shield, Bell, HelpCircle } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 lg:px-0">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark font-bold text-2xl">
              {user?.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user?.full_name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-primary-light text-primary-dark px-3 py-0.5 rounded-full font-medium capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-50">
            <User size={20} className="text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">แก้ไขโปรไฟล์</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-50">
            <Bell size={20} className="text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">การแจ้งเตือน</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-50">
            <Shield size={20} className="text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">ความปลอดภัย</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition">
            <HelpCircle size={20} className="text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">ช่วยเหลือ</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-white border border-danger/20 text-danger font-medium py-3 rounded-2xl hover:bg-danger/5 transition"
        >
          <LogOut size={18} /> ออกจากระบบ
        </button>
      </div>
    </AppLayout>
  );
}
