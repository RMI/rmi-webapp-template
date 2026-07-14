"""Integration tests for the widget demo router.

Uses the ``async_client`` fixture (in-memory SQLite + FastAPI ASGI transport)
and runs with ``AUTH_DISABLED=true``, so the auth dependency yields dev claims.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_list_widgets_starts_empty(async_client: AsyncClient) -> None:
    response = await async_client.get("/widgets/")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_create_widget_persists_and_lists(async_client: AsyncClient) -> None:
    create_response = await async_client.post(
        "/widgets/",
        json={"name": "Sprocket", "description": "A demo widget"},
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] > 0
    assert created["name"] == "Sprocket"
    assert created["description"] == "A demo widget"

    list_response = await async_client.get("/widgets/")
    assert list_response.status_code == 200
    widgets = list_response.json()
    assert [w["name"] for w in widgets] == ["Sprocket"]


@pytest.mark.anyio
async def test_get_widget_by_id(async_client: AsyncClient) -> None:
    create_response = await async_client.post("/widgets/", json={"name": "Widget"})
    widget_id = create_response.json()["id"]

    response = await async_client.get(f"/widgets/{widget_id}")
    assert response.status_code == 200
    assert response.json()["id"] == widget_id


@pytest.mark.anyio
async def test_get_widget_missing_returns_404(async_client: AsyncClient) -> None:
    response = await async_client.get("/widgets/99999")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_create_widget_rejects_blank_name(async_client: AsyncClient) -> None:
    response = await async_client.post("/widgets/", json={"name": ""})
    assert response.status_code == 422
