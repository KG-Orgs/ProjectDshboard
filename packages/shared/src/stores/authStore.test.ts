import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';

const demoUser = {
  id: '1',
  name: 'Demo User',
  email: 'demo@contractor.ai',
  role: 'manager' as const,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  });

  it('hydrates auth state from localStorage', () => {
    localStorage.setItem('auth_token', 'saved-token');
    localStorage.setItem('auth_user', JSON.stringify(demoUser));

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      token: 'saved-token',
      user: demoUser,
    });
  });

  it('logs in and persists token and user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          token: 'demo-token',
          user: demoUser,
        }),
      })
    );

    await useAuthStore.getState().login('demo@contractor.ai', 'demo123');

    expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@contractor.ai', password: 'demo123' }),
    });
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      token: 'demo-token',
      user: demoUser,
    });
    expect(localStorage.getItem('auth_token')).toBe('demo-token');
    expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(demoUser));
  });

  it('surfaces login failure without authenticating', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    await expect(
      useAuthStore.getState().login('wrong@contractor.ai', 'bad-pass')
    ).rejects.toThrow('Login failed');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logs out and clears persisted auth', async () => {
    localStorage.setItem('auth_token', 'saved-token');
    localStorage.setItem('auth_user', JSON.stringify(demoUser));
    useAuthStore.setState({
      isAuthenticated: true,
      user: demoUser,
      token: 'saved-token',
    });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      token: null,
    });
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
});