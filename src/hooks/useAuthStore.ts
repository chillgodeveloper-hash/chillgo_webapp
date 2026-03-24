import { create } from 'zustand';
import { Profile, PartnerProfile } from '@/types';

interface AuthState {
  user: Profile | null;
  partnerProfile: PartnerProfile | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setPartnerProfile: (profile: PartnerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  partnerProfile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setPartnerProfile: (partnerProfile) => set({ partnerProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, partnerProfile: null, isLoading: false }),
}));
