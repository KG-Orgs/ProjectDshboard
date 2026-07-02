import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingModal from './OnboardingModal';
import { ONBOARDING_STORAGE_KEY } from '../lib/onboarding';

vi.mock('framer-motion', () => {
  const passthrough = ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  );

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: () => passthrough,
      }
    ),
  };
});

describe('OnboardingModal', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the welcome step when open', () => {
    render(
      <OnboardingModal open onOpenChange={vi.fn()} projectName="MLJ-017" />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Construction document intelligence')).toBeInTheDocument();
    expect(screen.getByText(/Semantic search across your entire project corpus/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<OnboardingModal open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('advances through steps and marks onboarding complete on finish', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<OnboardingModal open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Link your project folder')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Chat with your documents')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Review plans with markups & citations')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Invite teammates to the same index')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('marks onboarding complete when skipping', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<OnboardingModal open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /Skip · don't show again/i }));

    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
