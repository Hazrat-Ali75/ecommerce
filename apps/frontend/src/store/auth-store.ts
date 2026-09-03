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

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
          // Set cookie for Next.js proxy.ts route protection
          document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `user_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
          document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          set({ isLoading: true });
          const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
          if (!token) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const res = await apiClient.get("/auth/me");
          set({ user: res.data, isAuthenticated: true, isLoading: false });
        } catch {
          get().clearAuth();
          set({ isLoading: false });
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
    }
  )
);
