import { create } from 'zustand';
import { User, LoginRequest, LoginResponse } from '../types';

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,

  // Restore auth state from localStorage on app load
  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('auth_user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          set({
            isAuthenticated: true,
            token,
            user,
          });
        } catch (error) {
          console.error('Failed to restore auth state:', error);
        }
      }
    }
  },

  login: async (email: string, password: string) => {
    try {
      // This would call your backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data: LoginResponse = await response.json();

      set({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
      });

      // Store token and user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    set({
      isAuthenticated: false,
      user: null,
      token: null,
    });

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  setToken: (token: string) => {
    set({ token });
  },
}));
