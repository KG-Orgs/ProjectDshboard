import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('POST /api/auth/login', () => {
  it('returns demo user data for valid demo credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'demo@contractor.ai',
        password: 'demo123',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toMatchObject({
      id: '1',
      orgId: 'org-1',
      name: 'Demo User',
      email: 'demo@contractor.ai',
      role: 'admin',
    });
    expect(data.token).toContain('demo_token_');
    expect(data.accessToken).toBe(data.token);
    expect(data.refreshToken).toBe('demo_refresh_token');
  });

  it('returns 401 for invalid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'wrong@contractor.ai',
        password: 'bad-pass',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Invalid credentials' });
  });
});