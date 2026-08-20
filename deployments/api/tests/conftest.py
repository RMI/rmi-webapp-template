"""Pytest fixtures for webapp-api tests.

Uses an in-memory SQLite database with the aiosqlite driver so tests run without
a live Postgres. The `Widget` model uses portable types, but if you add columns
that Postgres supports and SQLite doesn't (JSONB, ARRAY, etc.), switch tests to
a real Postgres or add SQLite-compatible variants in ``db/model/types.py``.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from typing import cast
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Ensure the app doesn't try to reach Postgres or Auth0 during tests.
os.environ.setdefault("DIALECT", "sqlite")
os.environ.setdefault("AUTH_DISABLED", "true")

from app.api.db.config import UnitOfWork, get_uow
from app.api.db.model import Base
from app.api.main import app


@pytest.fixture
def anyio_backend() -> str:
    """aiosqlite doesn't support trio; force asyncio."""
    return "asyncio"


@pytest.fixture
async def session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        yield factory
    finally:
        await engine.dispose()


@pytest.fixture
def mock_session() -> MagicMock:
    """Mock AsyncSession used by UnitOfWork unit tests."""
    session = MagicMock(spec=AsyncSession)
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    return session


@pytest.fixture
def mock_session_factory(mock_session: MagicMock) -> MagicMock:
    """Mock async_sessionmaker that yields ``mock_session``."""
    factory = MagicMock(spec=async_sessionmaker)
    factory.return_value = mock_session
    return factory


@pytest.fixture
async def async_client(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncClient]:
    async def _override_uow():
        async with UnitOfWork(session_factory) as uow:
            yield uow

    app.dependency_overrides[get_uow] = _override_uow
    try:
        async with AsyncClient(
            transport=ASGITransport(app=cast("object", app)),
            base_url="http://test/api/v1",
        ) as client:
            yield client
    finally:
        app.dependency_overrides.pop(get_uow, None)
