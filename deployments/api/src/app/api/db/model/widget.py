from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from .common import Base
from .mixins import TimestampMixin


class Widget(TimestampMixin, Base):
    __tablename__ = "widgets"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
