"""
Takeoff CLI entrypoint.

Usage:
    takeoff <pdf_path> [--drawing-id <id>] [--db-url <url>]

Runs the full 10-phase pipeline against a single PDF and prints the
aggregated takeoff to stdout as JSON.
"""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        prog="takeoff",
        description="Run the construction takeoff pipeline against a CAD-exported PDF.",
    )
    parser.add_argument("pdf_path", type=Path, help="Path to the CAD-exported PDF.")
    parser.add_argument(
        "--drawing-id",
        default=None,
        help="Optional drawing ID (UUID). A random one is generated if omitted.",
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

    # Lazy imports so the CLI starts fast even if DB is unavailable.
    from takeoff.db import SessionLocal
    from takeoff.pipeline.orchestrator import PipelineOrchestrator

    db = SessionLocal()
    try:
        print(f"Running pipeline for drawing {drawing_id} …", file=sys.stderr)
        result = PipelineOrchestrator(db).run(pdf_path=str(pdf_path), drawing_id=drawing_id)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
