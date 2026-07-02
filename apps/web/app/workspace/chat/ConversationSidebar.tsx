'use client';

/**
 * ConversationSidebar
 *
 * A persistent ChatGPT/Claude-style conversation history sidebar.
 *
 * Layout:
 *   ┌─────────────────────────┐
 *   │ Header: project title + │
 *   │         New Chat button │
 *   │         Search input    │
 *   ├─────────────────────────┤
 *   │ Scrollable history list │
 *   │ (grouped by date)       │
 *   ├─────────────────────────┤
 *   │ Footer: user + settings │
 *   │         + collapse btn  │
 *   └─────────────────────────┘
 *
 * State is managed via useConversationStore (Zustand).
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHistoryList from './ChatHistoryList';
import { useConversationStore } from './useConversationStore';

interface Props {
  projectId: string | null;
  projectName?: string;
  userInitials?: string;
  /** Called when user selects a session — parent loads history. */
  onSessionSelect: (sessionId: string) => void;
  /** Called when user clicks "New Chat" — parent resets messages. */
  onNewChat: () => Promise<string | null>;
  /** Optional override for delete (e.g. confirm dialog). Defaults to store delete. */
  onDeleteSession?: (sessionId: string) => void | Promise<void>;
  /** The session currently rendering in the chat panel. */
  activeSessionId: string | null;
}

export default function ConversationSidebar({
  projectId,
  projectName,
  userInitials = 'U',
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  activeSessionId,
}: Props) {
  const {
    sessions,
    sidebarOpen,
    isLoading,
    error,
    fetchSessions,
    renameSession,
    pinSession,
    deleteSession,
    toggleSidebar,
    setActiveSession,
  } = useConversationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load history on mount / project change
  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions, projectId]);

  // Keyboard shortcuts: Ctrl+/ focuses search, Escape blurs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleDelete = onDeleteSession ?? deleteSession;

  const projectSessions = projectId
    ? sessions.filter((s) => s.projectId === projectId)
    : sessions;

  const handleNewChat = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const id = await onNewChat();
      if (id) setActiveSession(id);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelect = (id: string) => {
    setActiveSession(id);
    onSessionSelect(id);
  };

  return (
    <>
      {/* Floating toggle when sidebar is closed */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            key="toggle-open"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            type="button"
            onClick={toggleSidebar}
            aria-label="Open conversation history"
            className="absolute left-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 shadow-lg transition hover:border-blue-400 hover:text-blue-300"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="1" y="2" width="14" height="12" rx="2" />
              <line x1="5" y1="2" x2="5" y2="14" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 240 : 0,
          opacity: sidebarOpen ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950/95"
        style={{ minWidth: 0 }}
        aria-label="Conversation history"
      >
        {/* ── HEADER ──────────────────────────────────── */}
        <div className="flex flex-col gap-2 border-b border-slate-800/80 px-3 pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold text-slate-100">
                {projectName ?? 'Workspace'}
              </span>
              <span className="text-[10px] text-slate-500">Conversations</span>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                <polyline points="9,2 4,7 9,12" />
              </svg>
            </button>
          </div>

          {/* New Chat button */}
          <button
            type="button"
            onClick={() => void handleNewChat()}
            disabled={isCreating || !projectId}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 py-2 text-xs font-medium text-slate-200 transition hover:border-blue-400/70 hover:bg-blue-500/10 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreating ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-blue-400" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="6" y1="1" x2="6" y2="11" />
                <line x1="1" y1="6" x2="11" y2="6" />
              </svg>
            )}
            New Chat
          </button>

          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="5.2" cy="5.2" r="4" />
              <line x1="8.5" y1="8.5" x2="11" y2="11" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
              placeholder="Search (Ctrl+/)"
              className="w-full rounded-md border border-slate-700/70 bg-slate-900 py-1.5 pl-7 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* ── HISTORY LIST ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {error && (
            <p className="px-3 py-2 text-[11px] text-rose-400">
              {error}
            </p>
          )}
          <ChatHistoryList
            sessions={projectSessions}
            activeSessionId={activeSessionId}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSelect={handleSelect}
            onRename={renameSession}
            onPin={pinSession}
            onDelete={(id) => void handleDelete(id)}
          />
        </div>

        {/* ── FOOTER ──────────────────────────────────── */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 px-3 py-2.5">
          {/* User avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/80 text-[10px] font-bold text-white">
            {userInitials.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-slate-400">Signed in</p>
          </div>
          {/* Settings */}
          <button
            type="button"
            aria-label="Settings"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="2" />
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.5 2.5l1 1M10.5 10.5l1 1M10.5 2.5l-1 1M3.5 10.5l-1 1" />
            </svg>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
