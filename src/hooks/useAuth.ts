'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuthStore } from './useAuthStore';

export function useAuth(requireRole?: string) {
  const router = useRouter();
  const { user, setUser, setPartnerProfile, setLoading, isLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setLoading(false);
        if (requireRole) router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUser(profile);

        if (!profile.role) {
          setLoading(false);
          router.push('/auth/role-select');
          return;
        }

        if (profile.role === 'partner') {
          const { data: allPPs } = await supabase
            .from('partner_profiles')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

          if (allPPs && allPPs.length > 0) {
            const activeId = typeof window !== 'undefined' ? localStorage.getItem('active_partner_id') : null;
            const activePP = activeId ? allPPs.find((p: any) => p.id === activeId) : null;

            if (activePP) {
              setPartnerProfile(activePP);
              if (!activePP.portfolio_images || activePP.portfolio_images.length === 0) {
                setLoading(false);
                router.push('/dashboard/partner/setup');
                return;
              }
            } else {
              const unfinished = allPPs.find((p: any) => !p.portfolio_images || p.portfolio_images.length === 0);
              if (unfinished) {
                if (typeof window !== 'undefined') localStorage.setItem('active_partner_id', unfinished.id);
                setPartnerProfile(unfinished);
                setLoading(false);
                router.push('/dashboard/partner/setup');
                return;
              }
              if (typeof window !== 'undefined') localStorage.setItem('active_partner_id', allPPs[0].id);
              setPartnerProfile(allPPs[0]);
            }
          }
        }

        if (requireRole && profile.role !== requireRole && requireRole !== 'any') {
          router.push('/feed');
        }
      }

      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setPartnerProfile(null);
          router.push('/auth/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading };
}
