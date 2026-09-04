import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      setHasHydrated: (val: boolean) => set({ hasHydrated: val }),

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
          const isSecure = window.location.protocol === "https:" ? "; Secure" : "";
          // Set cookie for Next.js proxy.ts route protection
          document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax${isSecure}`;
          document.cookie = `user_role=${user.role}; path=/; max-age=604800; SameSite=Lax${isSecure}`;
        }
        set({ user, token, isAuthenticated: true, hasHydrated: true });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          const isSecure = window.location.protocol === "https:" ? "; Secure" : "";
          document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax${isSecure}`;
          document.cookie = `user_role=; path=/; max-age=0; SameSite=Lax${isSecure}`;
        }
        set({ user: null, token: null, isAuthenticated: false, hasHydrated: true });
      },

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
          if (!token) {
            set({ user: null, isAuthenticated: false, isLoading: false, hasHydrated: true });
            return;
          }

          const res = await apiClient.get("/auth/me");
          set({ user: res.data, isAuthenticated: true, isLoading: false, hasHydrated: true });
        } catch {
          get().clearAuth();
          set({ isLoading: false, hasHydrated: true });
        }
      },

      logout: async () => {
        try {
          await apiClient.post("/auth/logout");
        } catch {
          // ignore error
        } finally {
          get().clearAuth();
        }
      },
    }),
    {
      name: "banglacart-auth",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
