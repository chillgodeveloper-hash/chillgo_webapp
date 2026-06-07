'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import AppLayout from '@/components/layout/AppLayout';
import { Search, Trash2, Loader2, AlertTriangle, ShieldCheck, Map as MapIcon, ShoppingBag } from 'lucide-react';

interface Account {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  categories: string[];
}

const ROLE_LABEL: Record<string, string> = { admin: 'แอดมิน', partner: 'พาร์ทเนอร์', customer: 'ลูกค้า' };
const CAT_LABEL: Record<string, string> = { guide: '🗺️ ไกด์', driver: '🚗 คนขับรถ' };

export default function AdminAccountsPage() {
  const supabase = createClient();
  const { user } = useAuthStore();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'partner'>('all');
  const [target, setTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: pps }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_profiles').select('user_id, category'),
    ]);
    const catMap = new Map<string, string[]>();
    (pps || []).forEach((p: any) => {
      const arr = catMap.get(p.user_id) || [];
      if (!arr.includes(p.category)) arr.push(p.category);
      catMap.set(p.user_id, arr);
    });
    setAccounts((profiles || []).map((p: any) => ({ ...p, categories: catMap.get(p.id) || [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');
      setAccounts((prev) => prev.filter((a) => a.id !== target.id));
      setTarget(null);
    } catch (e: any) {
      setError(e.message || 'ลบไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = accounts.filter((a) => {
    if (roleFilter === 'customer' && a.role !== 'customer') return false;
    if (roleFilter === 'partner' && a.role !== 'partner') return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.full_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 lg:px-0 py-6 animate-blur-in lg:py-8">
        <h1 className="text-2xl font-bold text-tmain mb-1">บัญชีทั้งหมด</h1>
        <p className="text-sm text-tmuted mb-6">จัดการบัญชีลูกค้าและพาร์ทเนอร์ · ลบบัญชีจะลบข้อมูลที่เกี่ยวข้องทั้งหมด</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tmuted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรืออีเมล..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-primary-dark/30 focus:border-primary outline-none"
            />
          </div>
          <div className="flex gap-2">
            {([['all', 'ทั้งหมด'], ['customer', 'ลูกค้า'], ['partner', 'พาร์ทเนอร์']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={`px-4 h-12 rounded-2xl text-sm font-medium whitespace-nowrap transition ${roleFilter === key ? 'bg-primary text-dark-DEFAULT' : 'bg-white border border-primary-dark/30 text-tmain hover:bg-primary/10'}`}
              >{label}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-dark/20 overflow-hidden">
          <div className="hidden lg:grid grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] gap-4 p-4 bg-primary-light/70 text-xs font-medium text-tmuted uppercase">
            <span>ชื่อ</span>
            <span>อีเมล</span>
            <span>บทบาท</span>
            <span>วันที่สมัคร</span>
            <span>จัดการ</span>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-primary/20 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-tmuted">ไม่พบบัญชี</div>
          ) : (
            <div className="divide-y divide-primary-dark/10">
              {filtered.map((a) => {
                const isSelf = a.id === user?.id;
                return (
                  <div key={a.id} className="p-4 flex flex-col lg:grid lg:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] lg:items-center gap-2 lg:gap-4 hover:bg-primary-light/50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary-text font-bold text-sm shrink-0">
                        {a.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-tmain text-sm truncate">{a.full_name || '(ไม่มีชื่อ)'}</span>
                    </div>
                    <span className="text-sm text-tmuted truncate">{a.email}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                        a.role === 'admin' ? 'bg-danger/10 text-danger' : a.role === 'partner' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
                      }`}>
                        {a.role === 'admin' ? <ShieldCheck size={11} /> : a.role === 'partner' ? <MapIcon size={11} /> : <ShoppingBag size={11} />}
                        {ROLE_LABEL[a.role] || a.role}
                      </span>
                      {a.categories.map((c) => (
                        <span key={c} className="text-[10px] text-tmuted">{CAT_LABEL[c] || c}</span>
                      ))}
                    </span>
                    <span className="text-sm text-tmuted">{new Date(a.created_at).toLocaleDateString('th-TH')}</span>
                    <div className="lg:text-right">
                      {isSelf ? (
                        <span className="text-xs text-tmuted">บัญชีคุณ</span>
                      ) : a.role === 'admin' ? (
                        <span className="text-xs text-tmuted">—</span>
                      ) : (
                        <button
                          onClick={() => { setError(''); setTarget(a); }}
                          className="inline-flex items-center gap-1 text-xs text-danger hover:bg-danger/10 px-3 py-1.5 rounded-lg transition font-medium"
                        >
                          <Trash2 size={13} /> ลบ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setTarget(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 animate-slide-up">
            <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-danger" />
            </div>
            <h3 className="text-lg font-bold text-tmain text-center mb-1">ลบบัญชีนี้?</h3>
            <p className="text-sm text-tmuted text-center mb-4">
              กำลังจะลบ <strong className="text-tmain">{target.full_name || target.email}</strong> อย่างถาวร — รวมถึงโพสต์ การจอง แชท รีวิว และใบเสร็จที่เกี่ยวข้องทั้งหมด การกระทำนี้ย้อนกลับไม่ได้
            </p>
            {error && <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-2.5 mb-3 text-xs text-center">{error}</div>}
            <div className="flex gap-3">
              <button
                onClick={() => setTarget(null)}
                disabled={deleting}
                className="flex-1 bg-primary/20 text-tmain font-semibold py-3 rounded-2xl transition hover:bg-primary-dark/30 disabled:opacity-40"
              >ยกเลิก</button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-danger hover:bg-danger/90 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={16} /> ลบถาวร</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
