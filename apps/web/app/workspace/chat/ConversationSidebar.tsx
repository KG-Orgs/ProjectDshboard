'use client';

/**
 * ConversationSidebar
 *
 * Header-mounted chat history dropdown. Session switching, rename, pin, and
 * delete are controlled from the top bar — not inside the chat panel.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Search } from 'lucide-react';
import ChatHistoryList from './ChatHistoryList';
import { useConversationStore } from './useConversationStore';

interface Props {
  projectId: string | null;
  /** Called when user selects a session — parent loads history. */
  onSessionSelect: (sessionId: string) => void;
  /** Optional override for delete (e.g. confirm dialog). Defaults to store delete. */
  onDeleteSession?: (sessionId: string) => void | Promise<void>;
  /** The session currently rendering in the chat panel. */
  activeSessionId: string | null;
}

export default function ConversationSidebar({
  projectId,
  onSessionSelect,
  onDeleteSession,
  activeSessionId,
}: Props) {
  const {
    sessions,
    isLoading,
    error,
    fetchSessions,
    renameSession,
    pinSession,
    deleteSession,
    setActiveSession,
  } = useConversationStore();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions, projectId]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearchQuery('');
    }
  }, [open]);

  const handleDelete = onDeleteSession ?? deleteSession;

  const projectSessions = projectId
    ? sessions.filter((session) => session.projectId === projectId)
    : sessions;

  const handleSelect = (id: string) => {
    setActiveSession(id);
    onSessionSelect(id);
    setOpen(false);
  };

  return (
    <div className="ws-chat-history-menu" ref={menuRef}>
      <button
        type="button"
        className={`ws-topbar-btn ws-topbar-btn-icon ${open ? 'active' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Chat history"
      >
        <History size={14} aria-hidden />
        <span>Chat history</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="chat-history-dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="ws-chat-history-dropdown"
            role="dialog"
            aria-label="Chat history"
          >
            <div className="ws-chat-history-dropdown-header">
              <p className="ws-chat-history-dropdown-title">Conversations</p>
              <div className="ws-chat-history-search-wrap">
                <Search size={12} className="ws-chat-history-search-icon" aria-hidden />
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.stopPropagation();
                      setSearchQuery('');
                    }
                  }}
                  placeholder="Search conversations"
                  className="ws-chat-history-search-input"
                />
              </div>
            </div>

            <div className="ws-chat-history-dropdown-body">
              {error ? <p className="ws-chat-history-error">{error}</p> : null}
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
