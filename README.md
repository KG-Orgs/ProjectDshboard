# Takeoff

Construction takeoff software that converts CAD-exported PDFs into traceable material quantity reports.

**MVP scope:** structural steel in plan views from CAD-exported PDFs.

## Architecture

```
Drawing → View → ClassifiedEntity
                      ↓
                   Pattern → CalloutAssociation → MaterialType
                                                        ↓
                                               MaterialInstance → Quantity
```

The system processes drawings through a 10-phase pipeline:

| Phase | Description |
|-------|-------------|
| 1 | PDF ingestion — extract vector entities and text blocks |
| 2 | View detection — identify plan/section/detail viewports |
| 3 | Scale detection — parse scale text and graphic scale bars |
| 4 | Entity classification — tag each entity (grid, dim, hatch, leader, annotation, structural member) |
| 5 | Pattern detection — group residual structural members into beam/column patterns |
| 6 | Callout association — link annotation text to patterns (leader → schedule → proximity → TYP) |
| 7 | Material normalization — parse and normalize steel section designations against catalog |
| 8 | Instance generation — create one MaterialInstance per pattern |
| 9 | Quantity extraction — convert geometry to linear feet using the detected scale |
| 10 | Reporting — aggregate into summary and detail takeoff tables |

## Stack

- **Python** (managed with [uv](https://github.com/astral-sh/uv))
- **PostgreSQL** — primary database
- **FastAPI** — REST API
- **SQLAlchemy 2.0** — ORM
- **Alembic** — database migrations
- **pymupdf** — PDF vector extraction
- **shapely** + **rtree** — spatial geometry
- **Anthropic Claude API** — AI-assisted annotation role classification

## Setup

### 1. Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) — `pip install uv` or see uv docs
- PostgreSQL 14+ (with PostGIS extension)

### 2. Install dependencies

```bash
uv sync
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and ANTHROPIC_API_KEY
```

### 4. Create the database

```bash
createdb takeoff
psql takeoff -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 5. Run migrations

```bash
uv run alembic upgrade head
```

### 6. Start the API server

```bash
uv run uvicorn takeoff.api.main:app --reload
```

API docs available at <http://localhost:8000/docs>.

## Usage

### REST API

```bash
# Upload a PDF
curl -X POST http://localhost:8000/drawings/ \
  -F "file=@path/to/drawing.pdf"

# Run the pipeline
curl -X POST http://localhost:8000/takeoff/{drawing_id}/run

# Get results
curl http://localhost:8000/takeoff/{drawing_id}/results
```

### CLI

```bash
uv run takeoff path/to/drawing.pdf
# or
uv run python scripts/run_pipeline.py path/to/drawing.pdf | jq .summary
```

## Development

```bash
# Run tests
uv run pytest tests/ -v

# Lint
uv run ruff check src/

# Type-check
uv run mypy src/

# Generate a new migration after model changes
uv run alembic revision --autogenerate -m "describe your change"
```

## Project Status

All 10 pipeline phases are **stubbed** — they raise `NotImplementedError` with
implementation instructions. The data models, API routes, configuration, and
infrastructure wiring are complete. Implement phases in order (1 → 10), running
the smoke test suite after each phase.
