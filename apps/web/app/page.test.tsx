import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

const mockUseAuthStore = vi.fn();

vi.mock('@contractor/shared', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Home page', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReset();
  });

  it('shows the landing view when signed out and hydrates auth state', () => {
    const hydrate = vi.fn();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      hydrate,
    });

    render(<Home />);

    expect(hydrate).toHaveBeenCalled();
    expect(screen.getByText('Welcome to Contractor Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login');
  });

  it('shows the dashboard when signed in', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'Demo User' },
      hydrate: vi.fn(),
    });

    render(<Home />);

    expect(screen.getByText('Welcome back, Demo User!')).toBeInTheDocument();
    expect(screen.getByText("Here's your project overview")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View All Projects' })).toHaveAttribute('href', '/projects');
  });
});