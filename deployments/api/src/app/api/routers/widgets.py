from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from starlette.status import HTTP_201_CREATED, HTTP_404_NOT_FOUND

from app.api.auth import Claims
from app.api.db.config import UnitOfWorkDep
from app.api.db.model import Widget
from app.api.entities import WidgetCreate, WidgetView

router = APIRouter(prefix="/widgets", tags=["widgets"])


@router.get("/", response_model=list[WidgetView])
async def list_widgets(*, _claims: Claims, uow: UnitOfWorkDep) -> list[WidgetView]:
    result = await uow.session.execute(select(Widget).order_by(Widget.id))
    return [WidgetView.model_validate(w) for w in result.scalars()]


@router.post("/", response_model=WidgetView, status_code=HTTP_201_CREATED)
async def create_widget(
    payload: WidgetCreate,
    *,
    _claims: Claims,
    uow: UnitOfWorkDep,
) -> WidgetView:
    widget = Widget(name=payload.name, description=payload.description)
    uow.session.add(widget)
    await uow.session.flush()
    return WidgetView.model_validate(widget)


@router.get("/{widget_id}", response_model=WidgetView)
async def get_widget(
    widget_id: int, *, _claims: Claims, uow: UnitOfWorkDep
) -> WidgetView:
    widget = await uow.session.get(Widget, widget_id)
    if widget is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Widget not found")
    return WidgetView.model_validate(widget)
