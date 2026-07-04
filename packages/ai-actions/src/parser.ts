import { randomUUID } from "node:crypto";
import type { AgentAction, AgentActionTool, ExtractActionsResult } from "./types";

/** Fenced code block pattern for agent-action blocks emitted by the LLM. */
const ACTION_FENCE_PATTERN = /```agent-action\s*([\s\S]*?)```/g;

/**
 * Allowed tool names. Any tool name not in this set is silently dropped
 * so a misbehaving LLM cannot trigger unimplemented operations.
 */
const ALLOWED_TOOLS = new Set<AgentActionTool>([
  "add_pdf_markup",
  "update_pdf_markup",
  "delete_pdf_markup",
  "edit_excel_cells",
  "create_excel_file",
  "create_pdf_file",
]);

/**
 * Extracts structured agent-action blocks from a raw LLM response string.
 *
 * - Removes all action blocks from the text before returning it.
 * - Validates tool name and fileId; drops malformed or unknown actions silently.
 * - Caps output at 1 action per response (the first valid one wins).
 * - Never throws — parse errors are always swallowed.
 */
export function extractAgentActions(raw: string): ExtractActionsResult {
  const actions: AgentAction[] = [];
  const regex = new RegExp(ACTION_FENCE_PATTERN.source, "g");

  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    if (actions.length >= 1) break; // cap at 1

    try {
      const parsed = JSON.parse(match[1].trim()) as {
        tool?: unknown;
        fileId?: unknown;
        params?: unknown;
        description?: unknown;
      };

      const tool = typeof parsed.tool === "string" ? parsed.tool : null;
      const fileId = typeof parsed.fileId === "string" && parsed.fileId.length > 0
        ? parsed.fileId
        : null;

      if (!tool || !fileId || !ALLOWED_TOOLS.has(tool as AgentActionTool)) continue;

      actions.push({
        id: randomUUID(),
        tool: tool as AgentActionTool,
        fileId,
        params: (typeof parsed.params === "object" && parsed.params !== null
          ? parsed.params
          : {}) as AgentAction["params"],
        description: typeof parsed.description === "string" && parsed.description.length > 0
          ? parsed.description
          : tool,
      });
    } catch {
      // Malformed JSON — skip silently
    }
  }

  // Strip all action blocks from the display text
  const text = raw.replace(new RegExp(ACTION_FENCE_PATTERN.source, "g"), "").trim();

  return { text, actions };
}
