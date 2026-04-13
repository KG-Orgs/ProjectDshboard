import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const mockPush = vi.fn();
const mockLogin = vi.fn();

vi.mock('@contractor/shared', () => ({
  useAuthStore: () => ({
    login: mockLogin,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Login page', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockLogin.mockReset();
  });

  it('submits demo credentials and redirects to the dashboard', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'demo@contractor.ai');
    await user.type(screen.getByLabelText('Password'), 'demo123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('demo@contractor.ai', 'demo123');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('renders the login error when authentication fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Login failed'));

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'wrong@contractor.ai');
    await user.type(screen.getByLabelText('Password'), 'bad-pass');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Login failed')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});