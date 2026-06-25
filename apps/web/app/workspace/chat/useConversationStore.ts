'use client';

/**
 * useConversationStore
 *
 * Manages the full conversation sidebar lifecycle:
 *  - session list (grouped by date for rendering)
 *  - active session per project
 *  - CRUD (create / rename / pin / delete)
 *  - sidebar open/close state
 *
 * HOOK: When embedding conversations for semantic search, call the
 *       vector-indexing endpoint after each session update here.
 */

import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationSession {
  id: string;
  projectId: string;
  title: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export type DateGroup = 'pinned' | 'today' | 'yesterday' | 'last7days' | 'older';

export interface GroupedSessions {
  pinned: ConversationSession[];
  today: ConversationSession[];
  yesterday: ConversationSession[];
  last7days: ConversationSession[];
  older: ConversationSession[];
}

interface ConversationState {
  /** All sessions for the current user across all projects. */
  sessions: ConversationSession[];
  /** projectId → active sessionId. */
  activeSessionId: string | null;
  sidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;
  /** True while a rename/pin/delete is in-flight (optimistic UI). */
  isMutating: boolean;
}

interface ConversationActions {
  fetchSessions(): Promise<void>;
  setActiveSession(sessionId: string | null): void;
  createSession(projectId: string): Promise<string>;
  renameSession(id: string, title: string): Promise<void>;
  pinSession(id: string, pinned: boolean): Promise<void>;
  deleteSession(id: string): Promise<void>;
  toggleSidebar(): void;
  setSidebarOpen(open: boolean): void;
}

type ConversationStore = ConversationState & ConversationActions;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

/** Group and sort a flat session list for sidebar display. */
export function groupSessions(sessions: ConversationSession[]): GroupedSessions {
  const now = Date.now();
  const msPerDay = 86_400_000;
  const todayStart = now - (now % msPerDay);

  const result: GroupedSessions = {
    pinned: [],
    today: [],
    yesterday: [],
    last7days: [],
    older: [],
  };

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  for (const s of sorted) {
    if (s.pinned) {
      result.pinned.push(s);
      continue;
    }
    const age = now - new Date(s.updatedAt).getTime();
    if (age < msPerDay && new Date(s.updatedAt).getTime() >= todayStart) {
      result.today.push(s);
    } else if (age < 2 * msPerDay) {
      result.yesterday.push(s);
    } else if (age < 7 * msPerDay) {
      result.last7days.push(s);
    } else {
      result.older.push(s);
    }
  }

  return result;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useConversationStore = create<ConversationStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  sidebarOpen: true,
  isLoading: false,
  error: null,
  isMutating: false,

  // ── Fetch all sessions for the current user ──────────────────────────────
  async fetchSessions() {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/chat/sessions', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to load chat history (${res.status}).`);
      }
      const data = (await res.json()) as { sessions: ConversationSession[] };
      set({ sessions: data.sessions ?? [], isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load conversations.',
      });
    }
  },

  // ── Set active session ───────────────────────────────────────────────────
  setActiveSession(sessionId) {
    set({ activeSessionId: sessionId });
  },

  // ── Create a new session ─────────────────────────────────────────────────
  async createSession(projectId) {
    set({ isMutating: true, error: null });
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          throw new Error('Session expired. Redirecting to login…');
        }
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Failed to create session (${res.status}).`);
      }
      const data = (await res.json()) as { session: ConversationSession };
      const session = data.session;
      set((state) => ({
        sessions: [session, ...state.sessions],
        activeSessionId: session.id,
        isMutating: false,
      }));
      return session.id;
    } catch (err) {
      set({
        isMutating: false,
        error: err instanceof Error ? err.message : 'Failed to create conversation.',
      });
      throw err;
    }
  },

  // ── Rename ───────────────────────────────────────────────────────────────
  async renameSession(id, title) {
    // Optimistic update
    set((state) => ({
      isMutating: true,
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title, updatedAt: nowIso() } : s
      ),
    }));
    try {
      const res = await fetch(`/api/chat/sessions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`Rename failed (${res.status}).`);
      const data = (await res.json()) as { session: ConversationSession };
      set((state) => ({
        isMutating: false,
        sessions: state.sessions.map((s) => (s.id === id ? data.session : s)),
      }));
    } catch (err) {
      // Revert optimistic on failure
      await get().fetchSessions();
      set({ isMutating: false, error: err instanceof Error ? err.message : 'Rename failed.' });
    }
  },

  // ── Pin / Unpin ──────────────────────────────────────────────────────────
  async pinSession(id, pinned) {
    set((state) => ({
      isMutating: true,
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, pinned, updatedAt: nowIso() } : s
      ),
    }));
    try {
      const res = await fetch(`/api/chat/sessions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      if (!res.ok) throw new Error(`Pin failed (${res.status}).`);
      const data = (await res.json()) as { session: ConversationSession };
      set((state) => ({
        isMutating: false,
        sessions: state.sessions.map((s) => (s.id === id ? data.session : s)),
      }));
    } catch (err) {
      await get().fetchSessions();
      set({ isMutating: false, error: err instanceof Error ? err.message : 'Pin failed.' });
    }
  },

  // ── Delete ───────────────────────────────────────────────────────────────
  async deleteSession(id) {
    // Optimistic removal
    const prev = get().sessions;
    set((state) => ({
      isMutating: true,
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    }));
    try {
      const res = await fetch(`/api/chat/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error(`Delete failed (${res.status}).`);
      set({ isMutating: false });
    } catch (err) {
      set({ sessions: prev, isMutating: false, error: err instanceof Error ? err.message : 'Delete failed.' });
    }
  },

  // ── Sidebar toggle ───────────────────────────────────────────────────────
  toggleSidebar() {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen(open) {
    set({ sidebarOpen: open });
  },
}));
