from datetime import datetime
from sqlalchemy import DateTime, func

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class TimestampMixin:
    created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
