from math import ceil
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field


class Timestamped(BaseModel):
    created: datetime = Field(default_factory=datetime.now)
    updated: datetime = Field(default_factory=datetime.now)


class TokenClaimsView(BaseModel):
    sub: str
    email: str | None = None
    name: str | None = None
    permissions: list[str] = Field(default_factory=list)
    raw: dict[str, Any] = Field(default_factory=dict)


class AuthMeView(BaseModel):
    claims: TokenClaimsView


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=200)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total_count: int
    page: int
    page_size: int

    @computed_field
    @property
    def total_pages(self) -> int:
        return ceil(self.total_count / self.page_size)


class WidgetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1024)


class WidgetView(Timestamped):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
