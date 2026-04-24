import { create } from 'zustand';
import { supabase } from '../services/supabase';

const useAuthStore = create((set) => ({
  session: null,
  user: null,
  loading: true,

  initializeAuth: async () => {
    // Check active session on initial load
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user || null, loading: false });

    // Listen for changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ session: newSession, user: newSession?.user || null });
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  }
}));

export default useAuthStore;
