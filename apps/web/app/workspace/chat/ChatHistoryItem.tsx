'use client';

/**
 * ChatHistoryItem
 *
 * Single conversation row in the sidebar history list.
 * Features:
 *  - Active highlight
 *  - Hover state with "…" context menu
 *  - Inline rename mode
 *  - Pin / Delete actions
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConversationSession } from './useConversationStore';

interface Props {
  session: ConversationSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ChatHistoryItem({
  session,
  isActive,
  onSelect,
  onRename,
  onPin,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title ?? '');
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const displayTitle = session.title || 'New conversation';

  // Close context menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Auto-focus rename input
  useEffect(() => {
    if (renaming) {
      renameRef.current?.select();
    }
  }, [renaming]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== session.title) {
      onRename(session.id, trimmed);
    }
    setRenaming(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
        isActive
          ? 'bg-blue-500/15 text-blue-50 ring-1 ring-inset ring-blue-400/30'
          : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
      }`}
    >
      {/* Click area */}
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col gap-0.5 text-left"
        onClick={() => {
          if (!renaming) onSelect(session.id);
        }}
      >
        {renaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded border border-blue-400/60 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-blue-400"
          />
        ) : (
          <span className="truncate text-xs font-medium leading-snug">
            {session.pinned && (
              <span className="mr-1 text-amber-400" aria-label="Pinned">
                ★
              </span>
            )}
            {displayTitle}
          </span>
        )}
        <span className="text-[10px] tabular-nums text-slate-500">
          {relativeTime(session.updatedAt)}
          {session.messageCount !== undefined && session.messageCount > 0
            ? ` · ${session.messageCount} msg`
            : ''}
        </span>
      </button>

      {/* "…" overflow button — visible on hover or when menu open */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-label="More options"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className={`flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-700 hover:text-slate-200 ${
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="7" cy="2" r="1.2" />
            <circle cx="7" cy="7" r="1.2" />
            <circle cx="7" cy="12" r="1.2" />
          </svg>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-7 z-50 min-w-[140px] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl"
            >
              <MenuItem
                label="Rename"
                icon="✏️"
                onClick={() => {
                  setRenameValue(session.title ?? '');
                  setRenaming(true);
                  setMenuOpen(false);
                }}
              />
              <MenuItem
                label={session.pinned ? 'Unpin' : 'Pin'}
                icon={session.pinned ? '📌' : '📌'}
                onClick={() => {
                  onPin(session.id, !session.pinned);
                  setMenuOpen(false);
                }}
              />
              <div className="my-1 border-t border-slate-800" />
              <MenuItem
                label="Delete"
                icon="🗑️"
                danger
                onClick={() => {
                  onDelete(session.id);
                  setMenuOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MenuItem({
  label,
  icon,
  danger = false,
  onClick,
}: {
  label: string;
  icon: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-slate-800 ${
        danger ? 'text-rose-400 hover:text-rose-300' : 'text-slate-200 hover:text-white'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}
