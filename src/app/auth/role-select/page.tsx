'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Map, Car, ShoppingBag, ArrowRight, LogOut } from 'lucide-react';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'partner' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'guide' | 'car_rental' | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleSubmit = async () => {
    if (!selectedRole || !user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ role: selectedRole })
      .eq('id', user.id);

    if (error) {
      setLoading(false);
      return;
    }

    if (selectedRole === 'partner' && selectedCategory) {
      await supabase.from('partner_profiles').insert({
        user_id: user.id,
        category: selectedCategory,
        business_name: user.full_name,
        description: '',
        portfolio_images: [],
        is_verified: false,
      });
      setUser({ ...user, role: 'partner' });
      router.push('/dashboard/partner/setup');
    } else {
      setUser({ ...user, role: 'customer' });
      router.push('/feed');
    }
  };

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-danger hover:bg-danger/10/80 transition px-3 py-2 rounded-xl hover:bg-danger/5"
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-tmain">คุณต้องการใช้งานในฐานะ?</h1>
          <p className="text-tmuted mt-2">เลือกบทบาทของคุณใน ChillGo</p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => { setSelectedRole('customer'); setSelectedCategory(null); }}
            className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
              selectedRole === 'customer'
                ? 'border-primary bg-primary-light shadow-lg'
                : 'border-primary-dark/30 bg-white hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                selectedRole === 'customer' ? 'bg-primary' : 'bg-primary-light'
              }`}>
                <ShoppingBag size={28} className={selectedRole === 'customer' ? 'text-dark-DEFAULT' : 'text-tmuted'} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tmain">ลูกค้า (Customer)</h3>
                <p className="text-sm text-tmuted">ค้นหาและจองบริการไกด์ รถเช่า</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('partner')}
            className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
              selectedRole === 'partner'
                ? 'border-secondary bg-orange-50 shadow-lg'
                : 'border-primary-dark/30 bg-white hover:border-secondary/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                selectedRole === 'partner' ? 'bg-secondary' : 'bg-primary-light'
              }`}>
                <Map size={28} className={selectedRole === 'partner' ? 'text-tmain' : 'text-tmuted'} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-tmain">พาร์ทเนอร์ (Partner)</h3>
                <p className="text-sm text-tmuted">เสนอบริการไกด์หรือรถเช่าของคุณ</p>
              </div>
            </div>
          </button>
        </div>

        {selectedRole === 'partner' && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-primary-dark/30 animate-fade-in">
            <h3 className="font-bold text-tmain mb-4">เลือกประเภทบริการ</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedCategory('guide')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedCategory === 'guide'
                    ? 'border-primary bg-primary-light'
                    : 'border-primary-dark/30 hover:border-primary/50'
                }`}
              >
                <Map size={32} className="mx-auto mb-2 text-secondary" />
                <p className="font-semibold text-sm">ไกด์</p>
              </button>
              <button
                onClick={() => setSelectedCategory('car_rental')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedCategory === 'car_rental'
                    ? 'border-primary bg-primary-light'
                    : 'border-primary-dark/30 hover:border-primary/50'
                }`}
              >
                <Car size={32} className="mx-auto mb-2 text-info" />
                <p className="font-semibold text-sm">รถเช่า</p>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedRole || (selectedRole === 'partner' && !selectedCategory) || loading}
          className="w-full bg-primary hover:bg-primary-dark text-dark-DEFAULT font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-primary/30"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-dark-DEFAULT/30 border-t-dark-DEFAULT rounded-full animate-spin" />
          ) : (
            <>
              ดำเนินการต่อ
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
