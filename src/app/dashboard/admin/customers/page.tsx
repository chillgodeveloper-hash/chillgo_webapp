'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import AppLayout from '@/components/layout/AppLayout';
import { Search, Mail, Calendar } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
      setCustomers(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = customers.filter((c) =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <h1 className="text-2xl font-bold text-tmain mb-6">จัดการลูกค้า</h1>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาลูกค้า..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 focus:border-primary outline-none"
          />
        </div>

        <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
          <div className="hidden lg:grid grid-cols-4 gap-4 p-4 bg-primary-light/70 text-xs font-medium text-tmuted uppercase">
            <span>ลูกค้า</span>
            <span>อีเมล</span>
            <span>วันที่สมัคร</span>
            <span>สถานะ</span>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">ไม่พบลูกค้า</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <div key={customer.id} className="p-4 flex flex-col lg:grid lg:grid-cols-4 lg:items-center gap-2 lg:gap-4 hover:bg-primary-light/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm">
                      {customer.full_name?.charAt(0)}
                    </div>
                    <span className="font-medium text-tmain text-sm">{customer.full_name}</span>
                  </div>
                  <span className="text-sm text-tmuted flex items-center gap-1">
                    <Mail size={12} className="lg:hidden" /> {customer.email}
                  </span>
                  <span className="text-sm text-tmuted flex items-center gap-1">
                    <Calendar size={12} className="lg:hidden" />
                    {new Date(customer.created_at).toLocaleDateString('th-TH')}
                  </span>
                  <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full w-fit font-medium">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
