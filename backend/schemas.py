from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel


class JobResponse(BaseModel):
    id: UUID
    title: str
    company: str | None = None
    description: str
    location: str
    department: str
    seniority: str
    salary_range: str
    posted_date: datetime
    match_score: float | None = None
    external_url: str | None = None
    source: str = "internal"
    applicant_count: int = 0

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class ResumeProfile(BaseModel):
    seniority: str
    domain: str
    skills: list[str]
    years_experience: int
    summary: str


class SkillGap(BaseModel):
    matching_skills: list[str]
    missing_skills: list[str]
    gap_score: float


class ResumeUploadResponse(BaseModel):
    profile: ResumeProfile
    matched_jobs: list[JobResponse]
    skill_gaps: dict[str, SkillGap] = {}  # keyed by job_id string


# --- Interview Coach schemas ---

class InterviewQuestion(BaseModel):
    category: str
    question: str
    why_asked: str
    tip: str


class InterviewPrepResponse(BaseModel):
    job_title: str
    questions: list[InterviewQuestion]


class InterviewPrepRequest(BaseModel):
    resume_summary: str = ""


# --- Application / ATS schemas ---

class ApplicationCreate(BaseModel):
    job_id: UUID


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: UUID
    job: JobResponse
    status: str
    notes: Optional[str]
    applied_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- User Resume Profile schema ---

class SavedResumeResponse(BaseModel):
    resume_summary: str
    updated_at: datetime


# --- Cover Letter schemas ---

class CoverLetterRequest(BaseModel):
    resume_summary: str = ""


class CoverLetterResponse(BaseModel):
    cover_letter: str


# --- Saved Jobs schemas ---

class SavedJobResponse(BaseModel):
    id: UUID
    job: JobResponse
    saved_at: datetime

    model_config = {"from_attributes": True}


# --- Job Alerts schemas ---

class JobAlertCreate(BaseModel):
    departments: list[str] = []
    seniorities: list[str] = []
    keywords: Optional[str] = None


class JobAlertResponse(BaseModel):
    id: UUID
    departments: list[str]
    seniorities: list[str]
    keywords: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
