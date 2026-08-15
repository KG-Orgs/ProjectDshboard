import type { ChatInterpretation, OpenDocContext } from "@contractor/shared";
import { getEnv } from "../config/env";
import { logger } from "../lib/logger";
import { parseIdentifierQuery } from "./identifier-lookup.service";

const CLASSIFIER_TIMEOUT_MS = 1200;

type RulesIntent = ChatInterpretation["intent"];

const ALLOWED_INTENTS: RulesIntent[] = [
  "greeting",
  "file_lookup",
  "active_doc_qa",
  "status_check",
  "schedule_risk",
  "cost_risk",
  "contract_notice",
  "document_summary",
  "general_qa",
];

const ALLOWED_INTENT_SET = new Set<RulesIntent>(ALLOWED_INTENTS);

export interface InterpretationContext {
  query: string;
  activeDocFileName?: string;
  openDocs?: OpenDocContext[];
}

/**
 * Returns true when the query is a document-summary or meeting-summary request
 * that should always route to retrieval rather than a vague-query clarification.
 * Pure synchronous, no side effects. Centralises document-summary intent detection
 * so the coordinator never needs its own phrase-specific bypass list.
 */
export function isDocumentSummaryQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    /\b(summary|summarize|overview|what is this|big picture)\b/.test(q) ||
    // "What is in the X letter / report / document"
    /\bwhat\s+is\s+in\s+the\b/.test(q) ||
    // "What was / were discussed in the September 3 meeting"
    (/\bwhat\s+(was|were)\s+discussed\b/.test(q) && /\bmeeting\b/.test(q))
  );
}

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeIntent(input: unknown): RulesIntent {
  if (typeof input !== "string") {
    return "general_qa";
  }

  return ALLOWED_INTENT_SET.has(input as RulesIntent)
    ? (input as RulesIntent)
    : "general_qa";
}

function fromRules(context: InterpretationContext): ChatInterpretation {
  const query = normalize(context.query);

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/.test(query)) {
    return {
      intent: "greeting",
      confidence: 0.98,
      source: "rules",
      retrievalHints: {
        preferredCategories: ["correspondence"],
      },
    };
  }

  if (/\b(find|locate|look(ing)? for|do we have|is there)\b/.test(query)) {
    return {
      intent: "file_lookup",
      confidence: 0.86,
      source: "rules",
      retrievalHints: {
        preferredCategories: ["drawing", "spec", "submittal", "rfi"],
      },
    };
  }

  if (
    context.activeDocFileName &&
    /\b(this|that|it|document|file|pdf|drawing|plan|spec)\b/.test(query)
  ) {
    return {
      intent: "active_doc_qa",
      confidence: 0.84,
      source: "rules",
      retrievalHints: {
        preferredTags: ["active_doc"],
      },
    };
  }

  if (/\b(critical path|float|delay|slippage|milestone|tia|schedule)\b/.test(query)) {
    return {
      intent: "schedule_risk",
      confidence: 0.81,
      source: "rules",
      alternatives: [{ intent: "status_check", confidence: 0.42 }],
      retrievalHints: {
        preferredCategories: ["schedule", "report", "rfi"],
        preferredTags: ["schedule", "delay", "milestone"],
        recencyBias: true,
      },
    };
  }

  if (/\b(cost|budget|overrun|change order|billing|retainage|variance|pay application)\b/.test(query)) {
    return {
      intent: "cost_risk",
      confidence: 0.8,
      source: "rules",
      alternatives: [{ intent: "contract_notice", confidence: 0.41 }],
      retrievalHints: {
        preferredCategories: ["change_order", "report", "invoice"],
        preferredTags: ["cost", "budget", "billing", "change_order"],
      },
    };
  }

  if (/\b(notice|contract|claim|liquidated damages|scope change|owner notification)\b/.test(query)) {
    return {
      intent: "contract_notice",
      confidence: 0.78,
      source: "rules",
      retrievalHints: {
        preferredCategories: ["contract", "rfi", "correspondence"],
        preferredTags: ["owner_notice", "rfi"],
      },
    };
  }

  if (/\b(status|latest|recent|open|pending|closed)\b/.test(query)) {
    return {
      intent: "status_check",
      confidence: 0.69,
      source: "rules",
      entities: {
        dateHint: /\b(latest|recent)\b/.test(query) ? "latest" : undefined,
        statusHint: /\bopen\b/.test(query)
          ? "open"
          : /\bpending\b/.test(query)
            ? "pending"
            : /\bclosed\b/.test(query)
              ? "closed"
              : undefined,
      },
      retrievalHints: {
        recencyBias: /\b(latest|recent)\b/.test(query),
      },
    };
  }

  if (
    /\b(summary|summarize|overview|what is this|big picture)\b/.test(query) ||
    // "What is in the X" — document-content queries without a specific topic
    /\bwhat\s+is\s+in\s+the\b/.test(query) ||
    // "What was / were discussed in the X meeting"
    (/\bwhat\s+(was|were)\s+discussed\b/.test(query) && /\bmeeting\b/.test(query))
  ) {
    return {
      intent: "document_summary",
      confidence: 0.71,
      source: "rules",
      retrievalHints: {
        preferredCategories: ["report", "drawing", "spec"],
      },
    };
  }

  return {
    intent: "general_qa",
    confidence: 0.55,
    source: "fallback",
    fallbackReason: "no_high_confidence_rule_match",
  };
}

function tryParseJsonObject(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function classifyWithLlm(context: InterpretationContext): Promise<ChatInterpretation | null> {
  const env = getEnv();
  if (!env.classifierApiKey || process.env.CHAT_INTERPRETER_ENABLE_LLM !== "true") {
    return null;
  }
  const endpoint = env.classifierEndpoint;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.classifierApiKey}`,
      },
      body: JSON.stringify({
        model: env.classifierModel,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: [
              "You are a construction chatbot router. Classify the user query and return strict JSON only — no prose.",
              "",
              "Return a JSON object with these keys:",
              "  intent        — one of: greeting, file_lookup, active_doc_qa, status_check, schedule_risk, cost_risk, contract_notice, document_summary, general_qa",
              "  confidence    — float 0-1",
              "  userRole      — inferred role: project_manager | superintendent | estimator | owner | subcontractor | architect | engineer | unknown",
              "  questionType  — rfi | submittal | schedule | cost | document_qa | draft_request | status_check | risk_flag | file_lookup | general",
              "  riskLevel     — low | medium | high | critical",
              "  proceedMode   — proceed (enough info to answer), assume (make reasonable assumptions and note them), ask (must clarify before answering)",
              "  requiredDocTypes — array of doc types to retrieve, e.g. ['rfi','schedule','drawing']. Empty array if no retrieval needed.",
              "  alternatives  — array of {intent, confidence} for runner-up intents",
              "  entities      — {rfiNumber?, submittalNumber?, specSection?, dateHint?, statusHint?, constructionIdentifiers?}",
              "  retrievalHints — {preferredCategories?, preferredTags?, recencyBias?, exactIdentifierFirst?}",
              "",
              "When the user names a construction document identifier (QWP-001, SWP-042, RFI-123, submittal numbers, etc.), set retrievalHints.exactIdentifierFirst=true and list normalized values in entities.constructionIdentifiers. Prefer exact identifier lookup over fuzzy filename matching.",
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              query: context.query,
              activeDocFileName: context.activeDocFileName,
              openDocCount: context.openDocs?.length ?? 0,
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = tryParseJsonObject(content);
    if (!parsed) {
      return null;
    }

    const intent = normalizeIntent(parsed.intent);
    const confidence = clamp01(Number(parsed.confidence ?? 0.5));
    const alternatives = Array.isArray(parsed.alternatives)
      ? parsed.alternatives
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const obj = item as Record<string, unknown>;
            return {
              intent: normalizeIntent(obj.intent),
              confidence: clamp01(Number(obj.confidence ?? 0)),
            };
          })
          .filter((item): item is NonNullable<ChatInterpretation["alternatives"]>[number] => Boolean(item))
          .slice(0, 3)
      : undefined;

    const entities = parsed.entities && typeof parsed.entities === "object"
      ? (parsed.entities as ChatInterpretation["entities"])
      : undefined;
    const retrievalHints = parsed.retrievalHints && typeof parsed.retrievalHints === "object"
      ? (parsed.retrievalHints as ChatInterpretation["retrievalHints"])
      : undefined;

    const userRole = (() => {
      const allowed = ["project_manager","superintendent","estimator","owner","subcontractor","architect","engineer","unknown"] as const;
      return allowed.includes(parsed.userRole as typeof allowed[number]) ? (parsed.userRole as typeof allowed[number]) : undefined;
    })();

    const questionType = (() => {
      const allowed = ["rfi","submittal","schedule","cost","document_qa","draft_request","status_check","risk_flag","file_lookup","general"] as const;
      return allowed.includes(parsed.questionType as typeof allowed[number]) ? (parsed.questionType as typeof allowed[number]) : undefined;
    })();

    const riskLevel = (() => {
      const allowed = ["low","medium","high","critical"] as const;
      return allowed.includes(parsed.riskLevel as typeof allowed[number]) ? (parsed.riskLevel as typeof allowed[number]) : undefined;
    })();

    const proceedMode = (() => {
      const allowed = ["ask","assume","proceed"] as const;
      return allowed.includes(parsed.proceedMode as typeof allowed[number]) ? (parsed.proceedMode as typeof allowed[number]) : undefined;
    })();

    const requiredDocTypes = Array.isArray(parsed.requiredDocTypes)
      ? (parsed.requiredDocTypes as unknown[]).filter((item): item is string => typeof item === "string").slice(0, 8)
      : undefined;

    return {
      intent,
      confidence,
      source: "llm",
      alternatives,
      entities,
      retrievalHints,
      userRole,
      questionType,
      riskLevel,
      proceedMode,
      requiredDocTypes,
    };
  } catch (error) {
    logger.warn("chat.interpretation.classifier_error", {
      reason:
        error instanceof Error && error.name === "AbortError"
          ? `classifier_timeout_${CLASSIFIER_TIMEOUT_MS}ms`
          : error instanceof Error
            ? error.message
            : "unknown",
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function enrichWithIdentifiers(
  interpretation: ChatInterpretation,
  query: string
): ChatInterpretation {
  const identifiers = parseIdentifierQuery(query);
  if (identifiers.length === 0) {
    return interpretation;
  }

  const values = identifiers.map((entry) => entry.valueNormalized);
  return {
    ...interpretation,
    entities: {
      ...interpretation.entities,
      constructionIdentifiers: [
        ...new Set([
          ...(interpretation.entities?.constructionIdentifiers ?? []),
          ...values,
        ]),
      ],
    },
    retrievalHints: {
      ...interpretation.retrievalHints,
      exactIdentifierFirst: true,
    },
  };
}

// Explicit multi-word meeting-type phrases that clearly imply meeting minutes.
// When any of these appear in a query the answer is overwhelmingly likely to
// live in a meeting_minutes or communication document, not in a progress report
// or submittal file.
const MEETING_PHRASE_RE =
  /\b(meeting\s+minutes|job\s+progress\s+meeting|coordination\s+meeting|progress\s+meeting|kick[\s-]?off\s*(meeting|conference)|pre[\s-]?work\s+conference)\b/i;

// Looser signal: the word "meeting" accompanied by attendance/discussion vocabulary.
const MEETING_CONTEXT_RE = /\b(attended|attendees|who\s+attended|presenter|agenda)\b/i;

/**
 * Steer retrieval toward `meeting_minutes` / `communication` files when the
 * query clearly refers to a meeting or meeting minutes.
 *
 * Two tiers of intervention:
 *
 * 1. **Strong signal** (`MEETING_PHRASE_RE`) — the query names an explicit
 *    meeting type (e.g. "Monthly Job Progress Meeting", "Coordination Meeting").
 *    In this case the answer lives almost exclusively in meeting-minutes files,
 *    so we create or widen the category restriction to
 *    `["meeting_minutes", "communication"]`.  An empty list (no existing
 *    restriction) is converted to this two-element list rather than left open,
 *    because leaving it open causes a large Progress Report (500+ chunks) to
 *    outrank the 30-chunk Meeting Minutes in unrestricted hybrid search.
 *
 * 2. **Weak signal** (`\bmeeting\b` + attendance vocabulary) — we only widen an
 *    already-restricted list, never create a new restriction from an empty one.
 *    This avoids narrowing an otherwise open search based on a vague cue.
 */
function enrichWithMeetingIntent(
  interpretation: ChatInterpretation,
  query: string
): ChatInterpretation {
  const existing = interpretation.retrievalHints?.preferredCategories ?? [];

  const strongMeetingQuery = MEETING_PHRASE_RE.test(query);
  const weakMeetingQuery =
    !strongMeetingQuery &&
    /\bmeeting\b/i.test(query) &&
    MEETING_CONTEXT_RE.test(query);

  if (!strongMeetingQuery && !weakMeetingQuery) {
    return interpretation;
  }

  const MEETING_CATEGORIES = ["meeting_minutes", "communication"] as const;

  if (strongMeetingQuery) {
    // Already covers meeting types — no change needed.
    if (MEETING_CATEGORIES.every((c) => existing.includes(c))) {
      return interpretation;
    }

    // Either create a new restriction or widen the existing one.
    // Also ensure confidence >= 0.65 so resolveIntentSearchScope honours the
    // preferredCategories list (it ignores the list when confidence < 0.65).
    const merged = Array.from(new Set([...existing, ...MEETING_CATEGORIES]));
    return {
      ...interpretation,
      // Raise confidence to the minimum needed to honour preferredCategories.
      // We only raise it, never lower it.
      confidence: Math.max(interpretation.confidence, 0.65),
      retrievalHints: {
        ...interpretation.retrievalHints,
        preferredCategories: merged,
      },
    };
  }

  // Weak signal: only widen a non-empty restriction list.
  if (existing.length === 0 || MEETING_CATEGORIES.every((c) => existing.includes(c))) {
    return interpretation;
  }

  return {
    ...interpretation,
    retrievalHints: {
      ...interpretation.retrievalHints,
      preferredCategories: Array.from(new Set([...existing, ...MEETING_CATEGORIES])),
    },
  };
}

export const interpretationService = {
  async interpret(context: InterpretationContext): Promise<ChatInterpretation> {
    const trimmedContext: InterpretationContext = {
      ...context,
      query: context.query.trim().slice(0, 1000),
    };

    const rules = fromRules(trimmedContext);
    const llm = await classifyWithLlm(trimmedContext);

    let base: ChatInterpretation;
    if (llm && llm.confidence >= 0.65) {
      base = llm;
    } else if (llm && llm.confidence > rules.confidence) {
      base = llm;
    } else {
      base = rules;
    }

    return enrichWithMeetingIntent(
      enrichWithIdentifiers(base, trimmedContext.query),
      trimmedContext.query
    );
  },
};
