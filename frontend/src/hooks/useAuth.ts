import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  error: string | null;

  setUser: (user: AuthUser) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setRole: (role: string) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthStore>()(
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
        set({ isLoading: true });
        set({
          user: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);

export default useAuthStore;
