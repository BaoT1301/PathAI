from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Depends, Query, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, get_db, Base
from models import Job, Application, JobAlert, SavedJob, UserProfile
from schemas import JobResponse, JobListResponse, ResumeUploadResponse, ApplicationCreate, ApplicationUpdate, ApplicationResponse, InterviewPrepRequest, InterviewPrepResponse, InterviewQuestion, JobAlertCreate, JobAlertResponse, CoverLetterRequest, CoverLetterResponse, SavedJobResponse, SavedResumeResponse
from services.embedding import get_embedding
from services.resume_parser import extract_text, parse_resume
from services.matching import get_matched_jobs
from services.skill_gap import analyze_skill_gap
from services.interview_coach import generate_interview_prep
from services.adzuna_client import fetch_and_store_adzuna_jobs, seed_jobs_from_adzuna
from auth import get_current_user, require_auth
from config import FRONTEND_URL
import json


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active = [c for c in self.active if c is not ws]

    async def broadcast(self, data: dict):
        payload = json.dumps(data, default=str)
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import sqlalchemy
    async with engine.begin() as conn:
        await conn.execute(sqlalchemy.text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        # Add columns introduced after initial table creation (idempotent)
        for stmt in [
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company VARCHAR(255)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'internal'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS external_id VARCHAR(255)",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS external_url TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ai_summary TEXT",
            "CREATE INDEX IF NOT EXISTS ix_jobs_external_id ON jobs (external_id)",
            # HNSW vector index — O(log n) approximate nearest-neighbour search.
            # Handles 500k+ jobs without sequential scan degradation.
            "CREATE INDEX IF NOT EXISTS ix_jobs_embedding_hnsw ON jobs USING hnsw (embedding vector_cosine_ops)",
            "CREATE INDEX IF NOT EXISTS ix_jobs_department ON jobs (department)",
            "CREATE INDEX IF NOT EXISTS ix_jobs_seniority ON jobs (seniority)",
        ]:
            await conn.execute(sqlalchemy.text(stmt))
        # Remove all mock/seed jobs — only keep real jobs from external sources
        result = await conn.execute(sqlalchemy.text(
            "DELETE FROM jobs WHERE source = 'internal' OR source IS NULL"
        ))
        deleted = result.rowcount
        if deleted:
            print(f"[Startup] Removed {deleted} mock/internal jobs from DB")
        # Remove duplicate jobs — keep only the first inserted per (title, company)
        dedup_result = await conn.execute(sqlalchemy.text("""
            DELETE FROM jobs WHERE id NOT IN (
                SELECT DISTINCT ON (LOWER(title), LOWER(company)) id
                FROM jobs
                ORDER BY LOWER(title), LOWER(company), posted_date DESC
            )
        """))
        dupes = dedup_result.rowcount
        if dupes:
            print(f"[Startup] Removed {dupes} duplicate jobs from DB")
    # Seed real jobs in the background so the browse page has content immediately
    import asyncio as _asyncio
    from database import async_session as _async_session
    async def _seed():
        async with _async_session() as session:
            n = await seed_jobs_from_adzuna(session)
            print(f"[Startup] Seed complete — {n} new jobs added")
    _asyncio.ensure_future(_seed())
    yield


app = FastAPI(title="Personalized Career Site API", lifespan=lifespan)

_origins = [FRONTEND_URL, "http://localhost:3000"]
# Also allow Vercel preview deployments (e.g. path-ai-xxxx-user.vercel.app)
if FRONTEND_URL and ".vercel.app" in FRONTEND_URL:
    _origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/jobs", response_model=JobListResponse)
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    department: str | None = None,
    seniority: str | None = None,
    location: str | None = None,
    search: str | None = None,
):
    # Build a deduplicating subquery: one row per unique (title, company)
    import sqlalchemy
    dedup_sub = (
        select(Job.id)
        .distinct(func.lower(Job.title), func.lower(Job.company))
        .where(Job.source != "internal")
        .order_by(func.lower(Job.title), func.lower(Job.company), Job.posted_date.desc())
        .subquery()
    )

    base_filter = [Job.id.in_(select(dedup_sub.c.id))]
    if department:
        base_filter.append(Job.department == department)
    if seniority:
        base_filter.append(Job.seniority == seniority)
    if location:
        base_filter.append(Job.location.ilike(f"%{location}%"))
    if search:
        base_filter.append(Job.title.ilike(f"%{search}%") | Job.description.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(Job).where(*base_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = (
        select(Job)
        .where(*base_filter)
        .order_by(func.random())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    jobs = result.scalars().all()

    return JobListResponse(
        jobs=[JobResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    count_result = await db.execute(
        select(func.count()).select_from(Application).where(Application.job_id == job.id)
    )
    applicant_count = count_result.scalar() or 0
    resp = JobResponse.model_validate(job)
    resp.applicant_count = applicant_count
    return resp


@app.get("/api/jobs/{job_id}/summary")
async def get_job_summary(job_id: str, db: AsyncSession = Depends(get_db)):
    """Return an AI-generated structured summary of the job. Cached in DB after first call."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Return cached summary if available
    if job.ai_summary:
        return json.loads(job.ai_summary)

    # Generate via GPT
    from openai import AsyncOpenAI
    from config import OPENAI_API_KEY
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    prompt = f"""Analyze this job posting and return a JSON object with exactly these keys:
- "required_skills": list of up to 8 specific technical/professional skills required (strings)
- "nice_to_have": list of up to 4 bonus skills mentioned (strings, empty if none)
- "highlights": list of up to 4 notable perks or facts (e.g. "Remote-friendly", "Series B startup", "Equity offered") (strings)
- "experience_level": short string like "3-5 years" or "Entry level" or "7+ years"
- "role_type": one of "Full-time", "Part-time", "Contract", "Internship"
- "one_liner": a single sentence (max 20 words) describing what this role does

Job title: {job.title}
Description: {job.description[:3000]}

Return ONLY valid JSON, no markdown."""

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=400,
        )
        raw = resp.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        summary = json.loads(raw)
    except Exception as e:
        print(f"[Summary] GPT error: {e}")
        summary = {
            "required_skills": [],
            "nice_to_have": [],
            "highlights": [],
            "experience_level": "Not specified",
            "role_type": "Full-time",
            "one_liner": job.title,
        }

    # Cache in DB
    job.ai_summary = json.dumps(summary)
    await db.commit()
    return summary


@app.post("/api/resume/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict | None = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Extract text from resume
    resume_text = extract_text(file_bytes, file.filename)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    # Parse resume with LLM and compute embedding in parallel
    import asyncio
    from schemas import SkillGap

    profile, resume_embedding = await asyncio.gather(
        parse_resume(resume_text),
        get_embedding(resume_text[:8000]),
    )

    # Vector search against already-seeded DB — fast, no external API calls
    db_jobs, _db_total = await get_matched_jobs(db, resume_embedding, profile, 1, 60)
    print(f"[DB] {len(db_jobs)} matched jobs from database")

    merged = sorted(db_jobs, key=lambda j: j.get("match_score") or 0, reverse=True)
    print(f"[Resume] {len(merged)} unique matched jobs after merge")

    # Apply pagination over merged results
    total = len(merged)
    start = (page - 1) * page_size
    matched_jobs = merged[start : start + page_size]

    # Compute skill gaps for top 5 (dict access — matched_jobs are plain dicts)
    top_jobs = merged[:5]
    gap_results = await asyncio.gather(
        *[analyze_skill_gap(job["description"], profile.skills) for job in top_jobs],
        return_exceptions=True,
    )

    skill_gaps: dict = {}
    for job, gap in zip(top_jobs, gap_results):
        if isinstance(gap, dict):
            skill_gaps[str(job["id"])] = SkillGap(**gap)

    # Persist resume summary to user profile if authenticated
    if user:
        from datetime import timezone as _tz
        existing_profile = await db.get(UserProfile, user["sub"])
        if existing_profile:
            existing_profile.resume_summary = profile.summary
            existing_profile.updated_at = datetime.now(_tz.utc)
        else:
            db.add(UserProfile(user_id=user["sub"], resume_summary=profile.summary))
        await db.commit()

    return ResumeUploadResponse(
        profile=profile,
        matched_jobs=matched_jobs,
        skill_gaps=skill_gaps,
    )


@app.post("/api/jobs/{job_id}/interview-prep", response_model=InterviewPrepResponse)
async def interview_prep(
    job_id: str,
    body: InterviewPrepRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    questions_data = await generate_interview_prep(
        job_title=job.title,
        job_description=job.description,
        resume_summary=body.resume_summary,
    )

    return InterviewPrepResponse(
        job_title=job.title,
        questions=[InterviewQuestion(**q) for q in questions_data],
    )


@app.get("/api/me/resume", response_model=SavedResumeResponse)
async def get_saved_resume(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    """Return the authenticated user's saved resume profile, if any."""
    profile = await db.get(UserProfile, user["sub"])
    if not profile or not profile.resume_summary:
        raise HTTPException(status_code=404, detail="No saved resume")
    return SavedResumeResponse(
        resume_summary=profile.resume_summary,
        updated_at=profile.updated_at,
    )


@app.post("/api/jobs/{job_id}/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    job_id: str,
    body: CoverLetterRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    from openai import AsyncOpenAI
    from config import OPENAI_API_KEY

    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # If no resume_summary in body, look up the user's saved profile
    resume_summary = body.resume_summary
    if not resume_summary:
        saved_profile = await db.get(UserProfile, user["sub"])
        if saved_profile and saved_profile.resume_summary:
            resume_summary = saved_profile.resume_summary

    openai = AsyncOpenAI(api_key=OPENAI_API_KEY)
    prompt = (
        f"Write a concise, professional cover letter for the following job.\n\n"
        f"Job Title: {job.title}\n"
        f"Company: {job.company or 'the company'}\n"
        f"Job Description (excerpt): {job.description[:2000]}\n\n"
        f"Candidate profile: {resume_summary or 'A motivated professional seeking this role.'}\n\n"
        "Instructions:\n"
        "- 3 short paragraphs (opening enthusiasm, relevant skills/experience, call to action)\n"
        "- Mention the specific role and company by name\n"
        "- Keep it under 250 words\n"
        "- Do not use generic filler phrases like 'I am writing to express my interest'\n"
        "- Return only the cover letter text, no subject line or sign-off"
    )

    response = await openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.7,
    )
    return CoverLetterResponse(cover_letter=response.choices[0].message.content.strip())


@app.get("/api/jobs/{job_id}/salary-insights")
async def salary_insights(job_id: str, db: AsyncSession = Depends(get_db)):
    """Returns salary market comparison vs same department/seniority."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get all jobs in same dept/seniority for market comparison
    peer_result = await db.execute(
        select(Job.salary_range).where(
            Job.department == job.department,
            Job.seniority == job.seniority,
        )
    )
    peer_salaries = [row[0] for row in peer_result.all()]

    def parse_salary(s: str) -> tuple[int, int] | None:
        import re
        nums = re.findall(r"[\d,]+", s.replace("k", "000").replace("K", "000"))
        nums = [int(n.replace(",", "")) for n in nums if n]
        if len(nums) >= 2:
            return nums[0], nums[1]
        if len(nums) == 1:
            return nums[0], nums[0]
        return None

    parsed = [parse_salary(s) for s in peer_salaries if parse_salary(s)]
    target = parse_salary(job.salary_range)

    if not parsed or not target:
        return {"min": None, "max": None, "median": None, "percentile": None, "negotiation_tip": None}

    midpoints = sorted([(lo + hi) / 2 for lo, hi in parsed])
    target_mid = (target[0] + target[1]) / 2
    count_below = sum(1 for m in midpoints if m < target_mid)
    percentile = round((count_below / len(midpoints)) * 100) if midpoints else 50

    median = sorted(midpoints)[len(midpoints) // 2]
    all_lows = [lo for lo, _ in parsed]
    all_highs = [hi for _, hi in parsed]

    return {
        "min": min(all_lows),
        "max": max(all_highs),
        "median": int(median),
        "percentile": percentile,
        "target_min": target[0],
        "target_max": target[1],
        "peer_count": len(parsed),
        "department": job.department,
        "seniority": job.seniority,
    }


@app.get("/api/departments")
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Job.department).distinct().order_by(Job.department)
    )
    return [row[0] for row in result.all()]


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ─────────────────────────────────────────────
# WebSocket — live job feed
# ─────────────────────────────────────────────

@app.websocket("/ws/jobs")
async def job_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Keep connection alive; client doesn't need to send messages
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─────────────────────────────────────────────
# Job creation endpoint (triggers WS broadcast)
# ─────────────────────────────────────────────

from pydantic import BaseModel as _BaseModel


class JobCreateRequest(_BaseModel):
    title: str
    description: str
    location: str
    department: str
    seniority: str
    salary_range: str


@app.post("/api/jobs", response_model=JobResponse)
async def create_job(body: JobCreateRequest, db: AsyncSession = Depends(get_db)):
    """Creates a new job and broadcasts it to all connected WebSocket clients."""
    import asyncio

    embedding = await get_embedding(f"{body.title}. {body.description}"[:8000])

    job = Job(
        title=body.title,
        description=body.description,
        location=body.location,
        department=body.department,
        seniority=body.seniority,
        salary_range=body.salary_range,
        embedding=embedding,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    job_response = JobResponse.model_validate(job)

    # Broadcast to all connected WebSocket clients
    await manager.broadcast({
        "type": "new_job",
        "job": job_response.model_dump(),
    })

    return job_response


# ─────────────────────────────────────────────
# Application / ATS endpoints
# ─────────────────────────────────────────────

@app.post("/api/applications", response_model=ApplicationResponse)
async def apply_to_job(
    body: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id = user["sub"]

    # Verify job exists
    job_result = await db.execute(select(Job).where(Job.id == body.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Prevent duplicate applications
    existing = await db.execute(
        select(Application).where(
            Application.user_id == user_id,
            Application.job_id == body.job_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already applied to this job")

    application = Application(user_id=user_id, job_id=body.job_id)
    db.add(application)
    await db.commit()
    await db.refresh(application)

    # Load the job relationship for the response
    result = await db.execute(
        select(Application).where(Application.id == application.id)
    )
    app_with_job = result.scalar_one()
    await db.refresh(app_with_job, ["job"])

    return ApplicationResponse(
        id=app_with_job.id,
        job=JobResponse.model_validate(app_with_job.job),
        status=app_with_job.status,
        notes=app_with_job.notes,
        applied_at=app_with_job.applied_at,
        updated_at=app_with_job.updated_at,
    )


@app.get("/api/applications", response_model=list[ApplicationResponse])
async def list_applications(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id = user["sub"]
    result = await db.execute(
        select(Application)
        .where(Application.user_id == user_id)
        .order_by(Application.applied_at.desc())
    )
    applications = result.scalars().all()

    responses = []
    for app in applications:
        await db.refresh(app, ["job"])
        responses.append(
            ApplicationResponse(
                id=app.id,
                job=JobResponse.model_validate(app.job),
                status=app.status,
                notes=app.notes,
                applied_at=app.applied_at,
                updated_at=app.updated_at,
            )
        )
    return responses


@app.patch("/api/applications/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: str,
    body: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    from datetime import datetime, timezone

    user_id = user["sub"]
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == user_id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if body.status is not None:
        application.status = body.status
    if body.notes is not None:
        application.notes = body.notes
    application.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(application, ["job"])

    return ApplicationResponse(
        id=application.id,
        job=JobResponse.model_validate(application.job),
        status=application.status,
        notes=application.notes,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
    )


@app.delete("/api/applications/{application_id}", status_code=204)
async def delete_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id = user["sub"]
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == user_id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.delete(application)
    await db.commit()


@app.get("/api/applications/{job_id}/status")
async def get_application_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict | None = Depends(get_current_user),
):
    """Returns the user's application status for a specific job (null if not applied)."""
    if not user:
        return {"status": None, "application_id": None}

    result = await db.execute(
        select(Application).where(
            Application.user_id == user["sub"],
            Application.job_id == job_id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        return {"status": None, "application_id": None}
    return {"status": application.status, "application_id": str(application.id)}


# ─────────────────────────────────────────────
# Job Alert endpoints
# ─────────────────────────────────────────────

@app.post("/api/alerts", response_model=JobAlertResponse)
async def create_alert(
    body: JobAlertCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    alert = JobAlert(
        user_id=user["sub"],
        departments=body.departments,
        seniorities=body.seniorities,
        keywords=body.keywords,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


@app.get("/api/alerts", response_model=list[JobAlertResponse])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    result = await db.execute(
        select(JobAlert).where(JobAlert.user_id == user["sub"]).order_by(JobAlert.created_at.desc())
    )
    return result.scalars().all()


@app.delete("/api/alerts/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    result = await db.execute(
        select(JobAlert).where(JobAlert.id == alert_id, JobAlert.user_id == user["sub"])
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    await db.commit()


# ─────────────────────────────────────────────
# Saved Jobs / Bookmarks endpoints
# ─────────────────────────────────────────────

@app.post("/api/saved-jobs", response_model=SavedJobResponse, status_code=201)
async def save_job(
    body: ApplicationCreate,  # reuse {job_id: UUID}
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    user_id = user["sub"]
    job_result = await db.execute(select(Job).where(Job.id == body.job_id))
    if not job_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Job not found")

    existing = await db.execute(
        select(SavedJob).where(SavedJob.user_id == user_id, SavedJob.job_id == body.job_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Job already saved")

    saved = SavedJob(user_id=user_id, job_id=body.job_id)
    db.add(saved)
    await db.commit()
    await db.refresh(saved)
    await db.refresh(saved, ["job"])
    return SavedJobResponse(
        id=saved.id,
        job=JobResponse.model_validate(saved.job),
        saved_at=saved.saved_at,
    )


@app.delete("/api/saved-jobs/{job_id}", status_code=204)
async def unsave_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    result = await db.execute(
        select(SavedJob).where(SavedJob.user_id == user["sub"], SavedJob.job_id == job_id)
    )
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved job not found")
    await db.delete(saved)
    await db.commit()


@app.get("/api/saved-jobs", response_model=list[SavedJobResponse])
async def list_saved_jobs(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_auth),
):
    result = await db.execute(
        select(SavedJob).where(SavedJob.user_id == user["sub"]).order_by(SavedJob.saved_at.desc())
    )
    saved_jobs = result.scalars().all()
    responses = []
    for s in saved_jobs:
        await db.refresh(s, ["job"])
        responses.append(SavedJobResponse(
            id=s.id,
            job=JobResponse.model_validate(s.job),
            saved_at=s.saved_at,
        ))
    return responses


@app.get("/api/saved-jobs/{job_id}/status")
async def get_saved_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict | None = Depends(get_current_user),
):
    if not user:
        return {"saved": False}
    result = await db.execute(
        select(SavedJob).where(SavedJob.user_id == user["sub"], SavedJob.job_id == job_id)
    )
    return {"saved": result.scalar_one_or_none() is not None}
