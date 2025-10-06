import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  subscriptionStatus: string;
  trialEndsAt: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = response.data;

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    set({ user, isAuthenticated: true, loading: false });
  },

  signup: async (email: string, password: string) => {
    await api.post('/auth/signup', { email, password });
  },

  logout: () => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, isAuthenticated: true, loading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));
