"""
Structural steel material catalog.

Maps raw callout text variants to normalized material type records.
Used by the MaterialNormalizer for deterministic matching before AI fallback.
"""

from __future__ import annotations

import re

# Normalization regex patterns per shape family
_W_SHAPE = re.compile(r'\bW\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\b')
_HSS_RECT = re.compile(r'\bHSS\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*[xX]\s*([\d./]+)\b', re.I)
_HSS_ROUND = re.compile(r'\bHSS\s*(\d+(?:\.\d+)?)\s*[xX]\s*([\d./]+)\b', re.I)
_PIPE = re.compile(r'\bPIPE\s*(\d+(?:\.\d+)?)\s*(STD|XS|XXS|SCH\s*\d+)?\b', re.I)
_ANGLE = re.compile(r'\bL\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*[xX]\s*([\d./]+)\b')
_CHANNEL = re.compile(r'\b(M?C)\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\b')


def normalize_material_text(raw: str) -> dict | None:
    """
    Attempt to normalize a raw callout string into a canonical material record.

    Returns a dict with keys: normalized_name, category, default_measurement_basis, default_unit
    or None if the text is not recognizable.
    """
    raw = raw.strip()

    # W-shape
    m = _W_SHAPE.search(raw)
    if m:
        name = f"W{m.group(1)}x{m.group(2)}"
        return {"normalized_name": name, "category": "structural_steel",
                "default_measurement_basis": "length", "default_unit": "LF"}

    # HSS rectangular
    m = _HSS_RECT.search(raw)
    if m:
        t = _fraction_to_decimal(m.group(3))
        name = f"HSS{m.group(1)}x{m.group(2)}x{t}"
        return {"normalized_name": name, "category": "structural_steel",
                "default_measurement_basis": "length", "default_unit": "LF"}

    # HSS round
    m = _HSS_ROUND.search(raw)
    if m:
        t = _fraction_to_decimal(m.group(2))
        name = f"HSS{m.group(1)}x{t}"
        return {"normalized_name": name, "category": "structural_steel",
                "default_measurement_basis": "length", "default_unit": "LF"}

    # Pipe
    m = _PIPE.search(raw)
    if m:
        suffix = (m.group(2) or "STD").strip().upper().replace(" ", "")
        name = f"PIPE{m.group(1)}{suffix}"
        return {"normalized_name": name, "category": "structural_steel",
                "default_measurement_basis": "length", "default_unit": "LF"}

    # Angle
    m = _ANGLE.search(raw)
    if m:
        t = _fraction_to_decimal(m.group(3))
        name = f"L{m.group(1)}x{m.group(2)}x{t}"
        return {"normalized_name": name, "category": "structural_steel",
                "default_measurement_basis": "length", "default_unit": "LF"}

    # Channel
    m = _CHANNEL.search(raw)
    if m:
        name = f"{m.group(1).upper()}{m.group(2)}x{m.group(3)}"
        return {"normalized_name": name, "category": "structural_steel",
                "default_measurement_basis": "length", "default_unit": "LF"}

    return None


def _fraction_to_decimal(s: str) -> str:
    """Convert '1/4' → '0.25', pass-through decimals."""
    s = s.strip()
    if '/' in s:
        num, den = s.split('/', 1)
        try:
            return str(round(int(num) / int(den), 4))
        except (ValueError, ZeroDivisionError):
            return s
    return s
