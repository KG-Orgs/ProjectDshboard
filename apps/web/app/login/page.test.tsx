import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoginPage from './page';

describe('Login page', () => {
  it('renders a Microsoft sign-in link that points at the web auth proxy route', () => {
    window.history.pushState({}, '', 'http://localhost:3000/login');
    render(<LoginPage />);

    expect(
      screen.getByRole('link', { name: 'Continue with Microsoft' })
    ).toHaveAttribute(
      'href',
      '/api/auth/login?redirectUri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&prompt=select_account'
    );
    expect(
      screen.getByText('Secure sign-in using your Microsoft account.')
    ).toBeInTheDocument();
  });

  it('does not crash when searchParams is undefined', () => {
    expect(() => render(<LoginPage />)).not.toThrow();
    expect(
      screen.getByRole('link', { name: 'Continue with Microsoft' })
    ).toBeInTheDocument();
  });

  it('renders a friendly setup message when OAuth is not configured', () => {
    render(
      <LoginPage
        searchParams={{
          error: 'oauth_not_configured',
          message: 'Microsoft OAuth is not configured',
        }}
      />
    );

    expect(screen.getByText('Microsoft OAuth is not configured')).toBeInTheDocument();
  });
});
