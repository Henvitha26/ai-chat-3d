import { create } from "zustand";
import { api } from "../api/client";

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const me = await api.get("/auth/me");
      set({ user: me.data });
    } finally {
      set({ loading: false });
    }
  },

  register: async (username, email, password) => {
    set({ loading: true });
    try {
      await api.post("/auth/register", { username, email, password });
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const me = await api.get("/auth/me");
      set({ user: me.data });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data });
    } catch {
      set({ user: null });
    }
  },
}));