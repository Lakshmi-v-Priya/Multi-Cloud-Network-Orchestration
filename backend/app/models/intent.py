
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Intent(Base):
    __tablename__ = "intents"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    workload: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    users: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    cpu: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    ram: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    storage: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    region: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    latency: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    availability: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    providers: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
