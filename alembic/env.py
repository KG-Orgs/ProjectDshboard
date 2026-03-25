from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# ---------------------------------------------------------------------------
# Alembic Config object — gives access to values in alembic.ini
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Import every model module so SQLAlchemy's metadata is fully populated
# before autogenerate runs.
# ---------------------------------------------------------------------------
from takeoff.config import settings  # noqa: E402
from takeoff.db import Base  # noqa: E402
import takeoff.models.drawing  # noqa: E402, F401
import takeoff.models.pattern  # noqa: E402, F401
import takeoff.models.callout  # noqa: E402, F401
import takeoff.models.material  # noqa: E402, F401
import takeoff.models.quantity  # noqa: E402, F401

target_metadata = Base.metadata

# Override the sqlalchemy.url with the value from pydantic-settings so the
# same .env file drives both the app and migrations.
config.set_main_option("sqlalchemy.url", settings.database_url)


# ---------------------------------------------------------------------------
# Offline migration (generate SQL script without a live DB connection)
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online migration (run against a live DB connection)
# ---------------------------------------------------------------------------
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
