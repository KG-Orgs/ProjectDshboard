import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConversationSidebar from './ConversationSidebar';
import { useConversationStore } from './useConversationStore';

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

const sampleSessions = [
  {
    id: 'session-1',
    projectId: 'project-321',
    title: 'Expansion joint review',
    pinned: false,
    createdAt: '2026-05-05T10:00:00.000Z',
    updatedAt: '2026-05-05T12:00:00.000Z',
    messageCount: 4,
  },
  {
    id: 'session-2',
    projectId: 'project-321',
    title: 'Steel delivery risks',
    pinned: true,
    createdAt: '2026-05-04T10:00:00.000Z',
    updatedAt: '2026-05-04T18:00:00.000Z',
    messageCount: 2,
  },
];

describe('ConversationSidebar header menu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useConversationStore.setState({
      sessions: [],
      activeSessionId: null,
      sidebarOpen: true,
      isLoading: false,
      error: null,
      isMutating: false,
    });
  });

  it('opens chat history from the header and lists project sessions', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/chat/sessions')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ sessions: sampleSessions }),
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ConversationSidebar
        projectId="project-321"
        activeSessionId="session-1"
        onSessionSelect={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog', { name: 'Chat history' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Chat history' }));

    const panel = await screen.findByRole('dialog', { name: 'Chat history' });
    expect(within(panel).getByText('Expansion joint review')).toBeInTheDocument();
    expect(within(panel).getByText('Steel delivery risks')).toBeInTheDocument();
  });

  it('selects a conversation and closes the dropdown', async () => {
    const user = userEvent.setup();
    const onSessionSelect = vi.fn();

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ sessions: sampleSessions }),
        })
      )
    );

    render(
      <ConversationSidebar
        projectId="project-321"
        activeSessionId="session-1"
        onSessionSelect={onSessionSelect}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Chat history' }));
    const panel = await screen.findByRole('dialog', { name: 'Chat history' });
    await user.click(within(panel).getByRole('button', { name: /Steel delivery risks/i }));

    expect(onSessionSelect).toHaveBeenCalledWith('session-2');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Chat history' })).not.toBeInTheDocument();
    });
  });

  it('routes delete through the parent handler', async () => {
    const user = userEvent.setup();
    const onDeleteSession = vi.fn();

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ sessions: sampleSessions }),
        })
      )
    );

    render(
      <ConversationSidebar
        projectId="project-321"
        activeSessionId="session-1"
        onSessionSelect={vi.fn()}
        onDeleteSession={onDeleteSession}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Chat history' }));
    const panel = await screen.findByRole('dialog', { name: 'Chat history' });
    const row = within(panel).getByRole('button', { name: /Expansion joint review/i }).closest('div');
    expect(row).toBeTruthy();

    await user.click(within(row as HTMLElement).getByRole('button', { name: 'More options' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDeleteSession).toHaveBeenCalledWith('session-1');
  });
});
