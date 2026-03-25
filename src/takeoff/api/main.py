from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from takeoff.api.routes import drawings, takeoff


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing needed yet (alembic handles migrations separately)
    yield
    # Shutdown


app = FastAPI(
    title="Takeoff API",
    description="Construction takeoff system — converts CAD-exported PDFs into traceable quantity graphs.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drawings.router, prefix="/drawings", tags=["drawings"])
app.include_router(takeoff.router, prefix="/takeoff", tags=["takeoff"])


@app.get("/health")
def health():
    return {"status": "ok"}
