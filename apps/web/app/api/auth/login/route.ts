import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Demo credentials for testing
    if (email === 'demo@contractor.ai' && password === 'demo123') {
      const user = {
        id: '1',
        orgId: 'org-1',
        name: 'Demo User',
        email: 'demo@contractor.ai',
        role: 'admin',
        createdAt: '2026-04-13T00:00:00.000Z',
      };

      const token = 'demo_token_' + Date.now();

      return NextResponse.json({
        user,
        token,
        accessToken: token,
        refreshToken: 'demo_refresh_token',
      });
    }

    // Any other credentials fail
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
