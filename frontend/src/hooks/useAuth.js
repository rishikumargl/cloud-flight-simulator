import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import keycloak from '../config/keycloak';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      error: null,

      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setRole: (role) => set({ role }),
      setError: (error) => set({ error }),

      logout: async () => {
        try {
          set({ isLoading: true });
          await keycloak.logout();
          set({
            user: null,
            isAuthenticated: false,
            role: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          // keycloak.init() called by AuthCallbackPage or App.jsx
          // This just signals successful initialization
          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);

export default useAuthStore;
