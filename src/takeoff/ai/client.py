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


def classify_material_type(text: str) -> dict:
    """
    Ask Claude to normalize a material designation text.

    Returns:
    {
      "normalized_name": str,
      "category": "structural_steel" | "unknown",
      "default_measurement_basis": "length" | "area" | "volume" | "count",
      "default_unit": "LF" | "SF" | "CF" | "EA",
      "confidence": float,
      "reasoning": str
    }
    """
    client = get_client()

    prompt = f"""You are analyzing a structural engineering drawing.
A text block has been identified as a material designation, but deterministic rules could not normalize it.

Text: "{text}"

Normalize this material designation to a canonical form. For structural steel:
- W-shapes: W10x77
- HSS: HSS6x6x1/4
- Pipes: PIPE6STD
- Angles: L3x3x1/4
- Channels: C8x11.5

If it's not a recognizable material, set category to "unknown" and normalized_name to "UNKNOWN_{text.upper().replace(' ', '_')}".

Respond with JSON only: {{"normalized_name": "...", "category": "...", "default_measurement_basis": "...", "default_unit": "...", "confidence": 0.0-1.0, "reasoning": "..."}}"""

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
        return {
            "normalized_name": f"UNKNOWN_{text.upper().replace(' ', '_')}",
            "category": "unknown",
            "default_measurement_basis": "length",
            "default_unit": "LF",
            "confidence": 0.0,
            "reasoning": "parse error"
        }
