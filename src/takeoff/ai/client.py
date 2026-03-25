"""
Anthropic Claude API client wrapper.

AI is used for the 15-20% of decisions that cannot be resolved by geometry and rules.
It is NEVER the final authority for any quantity-affecting output — only an evidence producer.

AI tasks in the MVP:
- Annotation role classification (remaining cases after deterministic regex)
- TYP scope inference (ambiguous cases)
- Ambiguous proximity disambiguation
"""

from __future__ import annotations

import anthropic

from takeoff.config import settings

# Use the latest capable model
MODEL = "claude-sonnet-4-6"


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def classify_annotation_role(
    text: str,
    font_size: float | None,
    nearby_pattern_class: str | None,
    is_leader_connected: bool,
    context_texts: list[str] | None = None,
) -> dict:
    """
    Ask Claude to classify the role of an annotation text block.

    Returns:
    {
      "role": "member_mark" | "elevation_note" | "general_note" | "material_designation" | ...,
      "confidence": float,
      "reasoning": str
    }
    """
    client = get_client()

    context = ""
    if context_texts:
        context = "\nNearby text blocks: " + ", ".join(f'"{t}"' for t in context_texts[:5])

    prompt = f"""You are analyzing a structural engineering drawing.
A text block has been extracted from a CAD-exported PDF.

Text: "{text}"
Font size (relative): {font_size}
Nearby pattern type: {nearby_pattern_class or "unknown"}
Connected to leader line: {is_leader_connected}{context}

Classify this text block's role. Choose from:
- material_designation (e.g. W10x77, HSS6x6x1/4)
- member_mark (e.g. B12, G4, C-1)
- detail_ref (e.g. 3/S401)
- section_ref
- elevation_note (e.g. TOP OF STEEL EL. 118'-0")
- dimension (a measured length)
- general_note (instructions, specifications)
- unknown

Respond with JSON only: {{"role": "...", "confidence": 0.0-1.0, "reasoning": "..."}}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    raw = response.content[0].text.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"role": "unknown", "confidence": 0.0, "reasoning": "parse error"}
