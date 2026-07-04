/**
 * Builds the system-prompt addendum injected when the user has a document open
 * and the AI is permitted to propose file-editing actions.
 *
 * Keep this addendum short — it sits inside the system prompt token budget.
 */
export function buildActionAddendum(activeDocFileId: string): string {
  return `
## File Action Capability
The user has a document open (fileId: ${activeDocFileId}).
You MAY propose ONE write action at the very end of your response — but ONLY when the user explicitly asks you to add a comment, note, or flag something on the document.

Emit the action in this exact fenced block (no extra text inside):

\`\`\`agent-action
{"tool":"add_pdf_markup","fileId":"${activeDocFileId}","params":{"pageNumber":1,"type":"comment","comment":"Your note here","category":"Review","assignedTo":""},"description":"Add comment on page 1: Your note here"}
\`\`\`

Rules — read carefully:
- Allowed tools: add_pdf_markup, update_pdf_markup, delete_pdf_markup.
- Allowed type values: "comment" only. Highlights and rectangles require coordinates you do not have.
- pageNumber must come from the retrieved source context — never guess a page number.
- Only propose delete or update if the user explicitly names an existing markup by ID.
- Emit at most ONE agent-action block. Never emit two.
- If the user is only asking a question, do NOT emit an action block.
`.trim();
}
