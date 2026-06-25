'use client';

/**
 * ChatHistoryList
 *
 * Renders the date-grouped conversation list.
 * Handles infinite-scroll pagination and empty / loading states.
 */

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatHistoryItem from './ChatHistoryItem';
import { groupSessions } from './useConversationStore';
import type { ConversationSession } from './useConversationStore';

interface Props {
  sessions: ConversationSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  searchQuery: string;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  /** Called when the user scrolls near the bottom (for future pagination). */
  onLoadMore?: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  pinned: 'Pinned',
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Previous 7 days',
  older: 'Older',
};

export default function ChatHistoryList({
  sessions,
  activeSessionId,
  isLoading,
  searchQuery,
  onSelect,
  onRename,
  onPin,
  onDelete,
  onLoadMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Infinite-scroll sentinel
  useEffect(() => {
    if (!onLoadMore || !bottomRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [onLoadMore]);

  const filtered = searchQuery.trim()
    ? sessions.filter((s) =>
        (s.title ?? 'New conversation').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  if (isLoading && sessions.length === 0) {
    return (
      <div className="space-y-2 px-2 py-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-slate-800"
            style={{ opacity: 1 - i * 0.18 }}
          />
        ))}
      </div>
    );
  }

  if (!isLoading && filtered.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <span className="text-2xl">💬</span>
        <p className="mt-2 text-xs text-slate-400">
          {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
        </p>
        {!searchQuery && (
          <p className="mt-1 text-[11px] text-slate-600">Click "New Chat" to get started.</p>
        )}
      </div>
    );
  }

  // When searching, show flat list without date groups
  if (searchQuery.trim()) {
    return (
      <div className="space-y-0.5 px-1 py-1">
        <AnimatePresence initial={false}>
          {filtered.map((s) => (
            <ChatHistoryItem
              key={s.id}
              session={s}
              isActive={s.id === activeSessionId}
              onSelect={onSelect}
              onRename={onRename}
              onPin={onPin}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} className="h-1" />
      </div>
    );
  }

  const groups = groupSessions(filtered);
  const groupOrder: (keyof typeof groups)[] = ['pinned', 'today', 'yesterday', 'last7days', 'older'];

  return (
    <div className="space-y-1 px-1 py-1">
      {groupOrder.map((key) => {
        const list = groups[key];
        if (list.length === 0) return null;
        return (
          <section key={key}>
            <p className="mb-0.5 px-2 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              {GROUP_LABELS[key]}
            </p>
            <AnimatePresence initial={false}>
              {list.map((s) => (
                <ChatHistoryItem
                  key={s.id}
                  session={s}
                  isActive={s.id === activeSessionId}
                  onSelect={onSelect}
                  onRename={onRename}
                  onPin={onPin}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </section>
        );
      })}

      {/* Infinite-scroll sentinel */}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
