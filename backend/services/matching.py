from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector
from models import Job
from schemas import ResumeProfile

# Maps resume domain → relevant job departments.
# Keeps results domain-appropriate (software engineers won't see nurse postings).
DOMAIN_TO_DEPTS: dict[str, list[str]] = {
    "software_engineering": ["engineering", "data_science", "product"],
    "data_science":         ["data_science", "engineering", "product"],
    "product":              ["product", "engineering", "design", "operations"],
    "design":               ["design", "product", "marketing"],
    "marketing":            ["marketing", "sales", "operations"],
    "sales":                ["sales", "marketing", "operations"],
    "finance":              ["finance", "operations"],
    "hr":                   ["hr", "operations"],
    "healthcare":           ["healthcare", "operations"],
    "operations":           ["operations", "finance", "hr"],
}

# Maps resume seniority to acceptable job seniority levels (wider range = more results)
SENIORITY_MATCH = {
    "intern": ["intern", "junior", "mid"],
    "junior": ["intern", "junior", "mid", "senior"],
    "mid": ["intern", "junior", "mid", "senior", "lead"],
    "senior": ["mid", "senior", "lead", "director"],
    "lead": ["senior", "lead", "director", "vp"],
    "director": ["senior", "lead", "director", "vp"],
    "vp": ["lead", "director", "vp", "c-suite"],
    "c-suite": ["director", "vp", "c-suite"],
}


def _normalize_score(cosine_sim: float, skills: list[str], job_text: str) -> float:
    """
    Map raw cosine similarity to a user-friendly 0–100 score.

    - Cosine similarity typically falls in [0.15, 0.65] for resume↔job pairs.
      We stretch that range to [0, 100] so users see meaningful percentages.
    - Keyword overlap adds up to +20 pts: broad skill keywords that appear in
      the job text signal relevance even when embedding similarity is moderate.
    """
    # Tighter range: real resume↔job cosine sims cluster in [0.10, 0.52]
    # Mapping this to [0, 100] makes good matches show 80-95%
    SIM_LOW, SIM_HIGH = 0.10, 0.52
    sim_score = max(0.0, min(100.0, (cosine_sim - SIM_LOW) / (SIM_HIGH - SIM_LOW) * 100))

    if skills:
        job_lower = job_text.lower()
        hits = sum(1 for s in skills if len(s) > 1 and s.lower() in job_lower)
        kw_score = min(15.0, hits / max(len(skills), 1) * 30.0)
    else:
        kw_score = 0.0

    return round(min(100.0, sim_score + kw_score), 1)


async def get_matched_jobs(
    db: AsyncSession,
    resume_embedding: list[float],
    profile: ResumeProfile,
    page: int = 1,
    page_size: int = 40,
) -> tuple[list[dict], int]:
    acceptable_seniority = SENIORITY_MATCH.get(profile.seniority, list(SENIORITY_MATCH.keys()))
    acceptable_depts = DOMAIN_TO_DEPTS.get(profile.domain)  # None = no domain filter

    distance = Job.embedding.cosine_distance(resume_embedding)

    def _build_query(seniority_filter: list[str] | None, dept_filter: list[str] | None):
        base = select(Job, distance.label("distance")).where(Job.embedding.is_not(None))
        if seniority_filter:
            base = base.where(Job.seniority.in_(seniority_filter))
        if dept_filter:
            base = base.where(Job.department.in_(dept_filter))
        return base.order_by(distance)

    def _build_count(seniority_filter: list[str] | None, dept_filter: list[str] | None):
        base = select(func.count()).select_from(Job).where(Job.embedding.is_not(None))
        if seniority_filter:
            base = base.where(Job.seniority.in_(seniority_filter))
        if dept_filter:
            base = base.where(Job.department.in_(dept_filter))
        return base

    # Try with both filters first; relax seniority if too few results; never relax domain
    total_result = await db.execute(_build_count(acceptable_seniority, acceptable_depts))
    total = total_result.scalar()
    active_seniority: list[str] | None = acceptable_seniority
    if total < 20:
        total_result = await db.execute(_build_count(None, acceptable_depts))
        total = total_result.scalar()
        active_seniority = None

    query = _build_query(active_seniority, acceptable_depts).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    rows = result.all()

    jobs = []
    for row in rows:
        job = row[0]
        cosine_sim = 1.0 - float(row[1])
        job_text = f"{job.title} {job.description}"
        score = _normalize_score(cosine_sim, profile.skills, job_text)
        job_dict = {
            "id": job.id,
            "title": job.title,
            "company": getattr(job, "company", None),
            "description": job.description,
            "location": job.location,
            "department": job.department,
            "seniority": job.seniority,
            "salary_range": job.salary_range,
            "posted_date": job.posted_date,
            "match_score": score,
            "external_url": getattr(job, "external_url", None),
            "source": getattr(job, "source", "internal"),
        }
        jobs.append(job_dict)

    return jobs, total
