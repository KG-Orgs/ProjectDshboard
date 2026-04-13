import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../state/authStore';

const demoUser = {
  id: '1',
  orgId: 'org-1',
  name: 'Demo User',
  email: 'demo@contractor.ai',
  role: 'admin' as const,
  createdAt: new Date('2026-04-13T00:00:00.000Z'),
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });
  });

  it('hydrates auth state from persisted storage', async () => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: demoUser,
          accessToken: 'saved-token',
          refreshToken: 'saved-refresh-token',
          isAuthenticated: true,
        },
        version: 0,
      })
    );

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      accessToken: 'saved-token',
      refreshToken: 'saved-refresh-token',
      user: expect.objectContaining({
        id: '1',
        orgId: 'org-1',
        name: 'Demo User',
        email: 'demo@contractor.ai',
        role: 'admin',
      }),
    });
  });

  it('logs in and persists token and user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'demo-token',
          refreshToken: 'refresh-token',
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
      accessToken: 'demo-token',
      refreshToken: 'refresh-token',
      user: demoUser,
    });
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
      accessToken: 'saved-token',
      refreshToken: 'refresh-token',
      isLoading: false,
      error: null,
    });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });
});