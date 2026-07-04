import type {
  ChatHistoryResponse,
  ChatHistoryTurn,
  ChatSession,
  ChatSessionsListResponse,
  ChatMessage,
  CreateChatSessionResponse,
  InterpretationFeedbackEvent,
  OpenDocContext,
  SendChatMessageResponse,
  UpdateChatSessionResponse,
  UUID,
} from "@contractor/shared";
import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq } from "drizzle-orm";
import {
  chatMessages,
  chatSessions,
  conversationDocuments,
  getDbIfInitialized,
} from "../db";
import { AppError } from "../lib/errors";
import { chatCoordinatorService } from "./chat-coordinator.service";
import type { RequestUserContext } from "./service-types";
import { toUuid } from "./service-types";

const sessions = new Map<UUID, CreateChatSessionResponse["session"]>();

/** Derive a display title from the first user prompt (max 60 chars). */
function deriveTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
}

export const chatService = {
  async createSession(
    projectId: UUID,
    user?: RequestUserContext
  ): Promise<CreateChatSessionResponse> {
    const db = getDbIfInitialized();
    const now = new Date();
    const session = {
      id: toUuid(randomUUID()),
      projectId,
      userId: toUuid(user?.id ?? "user-123"),
      title: null as string | null,
      pinned: false,
      updatedAt: now,
      createdAt: now,
    };

    if (db) {
      await db.insert(chatSessions).values({
        id: session.id,
        projectId: session.projectId,
        userId: session.userId,
        title: null,
        pinned: false,
        updatedAt: now,
        createdAt: now,
      });
    } else {
      sessions.set(session.id, session);
    }

    return { session };
  },

  async sendMessage(
    sessionId: UUID,
    message: string,
    history?: ChatHistoryTurn[],
    openDocs?: OpenDocContext[],
    activeDocFileName?: string,
    activeDocFileId?: UUID,
    feedback?: InterpretationFeedbackEvent,
    user?: RequestUserContext
  ): Promise<SendChatMessageResponse> {
    const db = getDbIfInitialized();
    const userId = user?.id ? toUuid(user.id) : undefined;

    const session = db
      ? (
          await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.id, sessionId))
            .limit(1)
        )[0]
      : sessions.get(sessionId);

    if (!session) {
      throw new AppError(404, "chat_session_not_found", "Chat session not found");
    }

    if (userId && session.userId !== userId) {
      throw new AppError(404, "chat_session_not_found", "Chat session not found");
    }

    const now = new Date();

    if (db) {
      await db.insert(chatMessages).values({
        id: toUuid(randomUUID()),
        sessionId,
        role: "user",
        content: message,
        feedback: feedback as unknown as Record<string, unknown>,
        createdAt: now,
      });

      // Auto-generate title from first user message if not yet set.
      // HOOK: replace deriveTitle() with an LLM summarisation call here
      //       for richer, context-aware titles (e.g. via OpenAI /completions).
      if (!session.title) {
        await db
          .update(chatSessions)
          .set({ title: deriveTitle(message), updatedAt: now })
          .where(eq(chatSessions.id, sessionId));
      } else {
        await db
          .update(chatSessions)
          .set({ updatedAt: now })
          .where(eq(chatSessions.id, sessionId));
      }
    }

    const coordinatorReply = await chatCoordinatorService.generateReply(
      toUuid(session.projectId),
      message,
      history,
      openDocs,
      activeDocFileName,
      activeDocFileId
    );

    const response: SendChatMessageResponse = {
      messageId: toUuid(randomUUID()),
      role: "assistant",
      content: coordinatorReply.content,
      sources: coordinatorReply.sources,
      citations: coordinatorReply.citations,
      interpretation: coordinatorReply.interpretation,
      suggestions: coordinatorReply.suggestions,
      autoOpenFileName: coordinatorReply.autoOpenFileName,
      coordinator: coordinatorReply.coordinator,
      agentActions: coordinatorReply.agentActions,
      createdAt: now,
    };

    if (db) {
      await db.insert(chatMessages).values({
        id: response.messageId,
        sessionId,
        role: "assistant",
        content: response.content,
        sources: response.sources as unknown as Record<string, unknown>,
        interpretation: response.interpretation as unknown as Record<string, unknown>,
        createdAt: response.createdAt,
      });

      // HOOK: After persisting the assistant reply, you can:
      //   1. Embed the full conversation turn and store in a vector index for semantic search.
      //   2. Record cited sources in conversation_documents for retrieval heat-mapping.
      //   3. Enqueue a summarisation job for long-term memory.
      if (coordinatorReply.sources?.length) {
        const docRows = coordinatorReply.sources
          .filter((s) => s.fileName)
          .map((s) => ({
            id: toUuid(randomUUID()),
            sessionId,
            fileId: s.fileId ? toUuid(s.fileId) : null,
            fileName: s.fileName,
            relevanceScore: Math.round((s.relevance ?? 0.5) * 100),
            createdAt: now,
          }));
        if (docRows.length > 0) {
          await db
            .insert(conversationDocuments)
            .values(docRows)
            .onConflictDoNothing();
        }
      }
    }

    return response;
  },

  async updateSession(
    sessionId: UUID,
    patch: { title?: string; pinned?: boolean },
    user?: RequestUserContext
  ): Promise<UpdateChatSessionResponse> {
    const db = getDbIfInitialized();
    const userId = user?.id ? toUuid(user.id) : undefined;

    if (db) {
      const rows = await db
        .select()
        .from(chatSessions)
        .where(
          userId
            ? and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
            : eq(chatSessions.id, sessionId)
        )
        .limit(1);

      if (!rows[0]) {
        throw new AppError(404, "chat_session_not_found", "Chat session not found");
      }

      const sets: Partial<typeof chatSessions.$inferInsert> = { updatedAt: new Date() };
      if (typeof patch.title === "string") sets.title = patch.title.trim().slice(0, 200);
      if (typeof patch.pinned === "boolean") sets.pinned = patch.pinned;

      const [updated] = await db
        .update(chatSessions)
        .set(sets)
        .where(eq(chatSessions.id, sessionId))
        .returning();

      return {
        session: {
          id: toUuid(updated.id),
          projectId: toUuid(updated.projectId),
          userId: toUuid(updated.userId),
          title: updated.title,
          pinned: updated.pinned,
          updatedAt: updated.updatedAt,
          createdAt: updated.createdAt,
        },
      };
    }

    const inMem = sessions.get(sessionId);
    if (!inMem) throw new AppError(404, "chat_session_not_found", "Chat session not found");
    const patched = {
      ...inMem,
      ...(typeof patch.title === "string" ? { title: patch.title } : {}),
      ...(typeof patch.pinned === "boolean" ? { pinned: patch.pinned } : {}),
      updatedAt: new Date(),
    };
    sessions.set(sessionId, patched);
    return { session: patched };
  },

  async deleteSession(sessionId: UUID, user?: RequestUserContext): Promise<void> {
    const db = getDbIfInitialized();
    const userId = user?.id ? toUuid(user.id) : undefined;

    if (db) {
      const rows = await db
        .select({ id: chatSessions.id })
        .from(chatSessions)
        .where(
          userId
            ? and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
            : eq(chatSessions.id, sessionId)
        )
        .limit(1);

      if (!rows[0]) {
        throw new AppError(404, "chat_session_not_found", "Chat session not found");
      }

      // Messages + conversationDocuments cascade via FK.
      await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
      return;
    }

    if (!sessions.has(sessionId)) {
      throw new AppError(404, "chat_session_not_found", "Chat session not found");
    }
    sessions.delete(sessionId);
  },

  async listSessionsForUser(user?: RequestUserContext): Promise<ChatSessionsListResponse> {
    if (!user?.id) {
      return { sessions: [] };
    }

    const userId = toUuid(user.id);
    const db = getDbIfInitialized();

    if (db) {
      // Join message count for display in the sidebar
      const rows = await db
        .select({
          id: chatSessions.id,
          projectId: chatSessions.projectId,
          userId: chatSessions.userId,
          title: chatSessions.title,
          pinned: chatSessions.pinned,
          updatedAt: chatSessions.updatedAt,
          createdAt: chatSessions.createdAt,
          messageCount: count(chatMessages.id),
        })
        .from(chatSessions)
        .leftJoin(chatMessages, eq(chatMessages.sessionId, chatSessions.id))
        .where(eq(chatSessions.userId, userId))
        .groupBy(chatSessions.id)
        .orderBy(desc(chatSessions.pinned), desc(chatSessions.updatedAt));

      return {
        sessions: rows.map((r) => ({
          id: toUuid(r.id),
          projectId: toUuid(r.projectId),
          userId: toUuid(r.userId),
          title: r.title,
          pinned: r.pinned,
          updatedAt: r.updatedAt,
          createdAt: r.createdAt,
          messageCount: r.messageCount,
        })),
      };
    }

    return {
      sessions: Array.from(sessions.values())
        .filter((s) => s.userId === userId)
        .map((s) => ({ ...s, pinned: (s as ChatSession).pinned ?? false, updatedAt: (s as ChatSession).updatedAt ?? s.createdAt })),
    };
  },

  async getHistoryForUser(sessionId: UUID, user?: RequestUserContext): Promise<ChatHistoryResponse> {
    if (!user?.id) {
      throw new AppError(404, "chat_session_not_found", "Chat session not found");
    }

    const db = getDbIfInitialized();
    const userId = toUuid(user.id);

    if (db) {
      const session = (
        await db
          .select()
          .from(chatSessions)
          .where(
            and(
              eq(chatSessions.id, sessionId),
              eq(chatSessions.userId, userId)
            )
          )
          .limit(1)
      )[0];

      if (!session) {
        throw new AppError(404, "chat_session_not_found", "Chat session not found");
      }

      const rows = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt));

      const messages: ChatMessage[] = rows.map((row) => ({
        id: toUuid(row.id),
        sessionId: toUuid(row.sessionId),
        role: row.role,
        content: row.content,
        sources: Array.isArray(row.sources)
          ? (row.sources as ChatMessage["sources"])
          : undefined,
        interpretation:
          row.interpretation && typeof row.interpretation === "object"
            ? (row.interpretation as ChatMessage["interpretation"])
            : undefined,
        feedback:
          row.feedback && typeof row.feedback === "object"
            ? (row.feedback as ChatMessage["feedback"])
            : undefined,
        createdAt: row.createdAt,
      }));

      return {
        messages,
        total: messages.length,
      };
    }

    const session = sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(404, "chat_session_not_found", "Chat session not found");
    }

    return {
      messages: [],
      total: 0,
    };
  },
};
