import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, ARRAY, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255))
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(100))
    seniority: Mapped[str] = mapped_column(String(50))
    salary_range: Mapped[str] = mapped_column(String(100))
    # Numeric salary bounds (annual USD) used for filtering/insights.
    # Nullable because not every posting publishes a salary.
    salary_min_value: Mapped[int | None] = mapped_column(nullable=True)
    salary_max_value: Mapped[int | None] = mapped_column(nullable=True)
    posted_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    embedding = mapped_column(Vector(1536), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    # External job source fields (Adzuna, etc.)
    source: Mapped[str] = mapped_column(String(50), server_default="internal")
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    external_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    # AI-generated structured summary (JSON, cached after first generation)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    applications: Mapped[list["Application"]] = relationship(back_populates="job")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_applications_user_job"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), index=True)  # Supabase auth.users UUID as string
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="applied")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    job: Mapped["Job"] = relationship(back_populates="applications")


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_saved_jobs_user_job"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    job: Mapped["Job"] = relationship()


class UserProfile(Base):
    """Stores the user's uploaded resume summary for reuse across features."""
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    resume_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Cached embedding of the uploaded resume so per-job match scores don't
    # re-call the OpenAI embedding API on every job view.
    resume_embedding = mapped_column(Vector(1536), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class JobAlert(Base):
    __tablename__ = "job_alerts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    departments: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    seniorities: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    keywords: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class JobEvent(Base):
    """Implicit-feedback signal: how a user interacted with a job. Used to
    personalize ranking over time (viewed / clicked / saved / applied /
    dismissed). Additive table; safe to create alongside the existing schema."""
    __tablename__ = "job_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class AiUsage(Base):
    """One row per AI-endpoint call by a signed-in user. Powers per-user daily
    quotas (protecting the OpenAI bill) and cost visibility. Additive table;
    created by create_all on boot."""
    __tablename__ = "ai_usage"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    endpoint: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
