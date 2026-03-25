#!/usr/bin/env python
"""
CLI runner for the construction takeoff pipeline.

Usage:
    uv run python scripts/run_pipeline.py <pdf_path> [--drawing-id <id>]

Runs all 10 pipeline phases against the given PDF and prints the aggregated
takeoff as JSON to stdout.  Progress messages go to stderr so that stdout
can be piped to jq or a file.

Example:
    uv run python scripts/run_pipeline.py drawings/S101.pdf | jq .summary
"""

from __future__ import annotations

import json
import shutil
import sys
import uuid
from pathlib import Path

# Ensure the src layout is importable when running directly.
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        prog="run_pipeline.py",
        description="Run the full takeoff pipeline against a CAD-exported PDF.",
    )
    parser.add_argument("pdf_path", type=Path, help="Path to the PDF file.")
    parser.add_argument(
        "--drawing-id",
        default=None,
        help="Optional drawing ID (UUID). Auto-generated if omitted.",
    )
    args = parser.parse_args()

    pdf_path: Path = args.pdf_path.resolve()
    if not pdf_path.exists():
        print(f"ERROR: File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    if pdf_path.suffix.lower() != ".pdf":
        print("ERROR: Only PDF files are accepted.", file=sys.stderr)
        sys.exit(1)

    drawing_id: str = args.drawing_id or str(uuid.uuid4())

    from takeoff.config import settings
    from takeoff.db import SessionLocal
    from takeoff.models.drawing import Drawing
    from takeoff.pipeline.orchestrator import PipelineOrchestrator

    # Copy PDF to storage area.
    storage_dir = Path(settings.storage_path) / drawing_id
    storage_dir.mkdir(parents=True, exist_ok=True)
    dest_pdf = storage_dir / "source.pdf"
    shutil.copy2(pdf_path, dest_pdf)
    print(f"[1/3] PDF copied to {dest_pdf}", file=sys.stderr)

    db = SessionLocal()
    try:
        print(f"[2/3] Running pipeline for drawing_id={drawing_id} …", file=sys.stderr)
        result = PipelineOrchestrator(db).run(pdf_path=str(dest_pdf), drawing_id=drawing_id)
        db.commit()
        print("[3/3] Pipeline complete.", file=sys.stderr)
    except NotImplementedError as exc:
        db.rollback()
        print(f"\nWARNING: Pipeline not yet fully implemented.\n{exc}", file=sys.stderr)
        # Still emit a minimal result so the caller gets valid JSON.
        result = {
            "drawing_id": drawing_id,
            "status": "pipeline_not_implemented",
            "summary": [],
            "detail": [],
        }
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
