"""
Adzuna job search integration.

Fetches real job listings from Adzuna, normalizes them to our schema,
upserts into the DB (so all features like Apply, Interview Coach, Salary
Insights work), and returns scored job dicts ready for the resume upload
response.
"""

import asyncio
import html
import math
import re
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import ADZUNA_APP_ID, ADZUNA_APP_KEY
from models import Job
from services.embedding import get_embedding


ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"

# Maps Adzuna category tags → our department slugs
CATEGORY_TO_DEPT: dict[str, str] = {
    "it-jobs": "engineering",
    "engineering-jobs": "engineering",
    "scientific-qa-jobs": "engineering",
    "energy-oil-gas-jobs": "engineering",
    "graduate-jobs": "engineering",
    "data-analytics-jobs": "data_science",
    "accounting-finance-jobs": "finance",
    "sales-jobs": "sales",
    "marketing-jobs": "marketing",
    "pr-jobs": "marketing",
    "creative-design-jobs": "design",
    "hr-jobs": "hr",
    "social-work-jobs": "hr",
    "legal-jobs": "operations",
    "management-jobs": "operations",
    "consultancy-jobs": "operations",
    "logistics-warehouse-jobs": "operations",
    "customer-services-jobs": "operations",
    "admin-jobs": "operations",
    "manufacturing-jobs": "operations",
    "trade-construction-jobs": "operations",
    "part-time-jobs": "operations",
    "hospitality-catering-jobs": "operations",
    "teaching-jobs": "operations",
    "healthcare-nursing-jobs": "healthcare",
}


def _infer_seniority(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ["intern", "internship", "apprentice"]):
        return "intern"
    if any(w in t for w in ["junior", "jr.", "jr ", "entry level", "entry-level", "graduate"]):
        return "junior"
    if any(w in t for w in ["senior", "sr.", "sr ", "staff", "principal", "expert"]):
        return "senior"
    if any(w in t for w in ["lead", "head of", "team lead"]):
        return "lead"
    if "director" in t:
        return "director"
    if any(w in t for w in ["vp ", "vice president"]):
        return "vp"
    if any(w in t for w in ["chief", " cto", " ceo", " coo", " cfo"]):
        return "c-suite"
    return "mid"


def _format_salary(az_job: dict) -> str:
    lo = az_job.get("salary_min")
    hi = az_job.get("salary_max")
    if lo and hi and lo != hi:
        return f"${int(lo / 1000)}k–${int(hi / 1000)}k"
    if lo:
        return f"${int(lo / 1000)}k+"
    return "Competitive"


def _salary_bounds(az_job: dict) -> tuple[int | None, int | None]:
    """Numeric (min, max) annual salary from a raw Adzuna job, or (None, None)."""
    lo = az_job.get("salary_min")
    hi = az_job.get("salary_max")
    lo_i = int(lo) if lo else None
    hi_i = int(hi) if hi else None
    # If only one bound is present, mirror it so range filters still work.
    if lo_i and not hi_i:
        hi_i = lo_i
    if hi_i and not lo_i:
        lo_i = hi_i
    return lo_i, hi_i


def parse_salary_range(s: str | None) -> tuple[int | None, int | None]:
    """Parse a display salary string (e.g. '$120k–$180k', '$100k+') back into
    numeric (min, max) dollars. Used to backfill rows stored before numeric
    salary columns existed. Returns (None, None) when unparseable."""
    if not s:
        return None, None
    # Normalise 'k'/'K' shorthand to thousands, then pull out the numbers.
    norm = s.replace("k", "000").replace("K", "000")
    nums = [int(n.replace(",", "")) for n in re.findall(r"[\d,]+", norm) if n.replace(",", "").isdigit()]
    if not nums:
        return None, None
    if len(nums) == 1:
        return nums[0], nums[0]
    return min(nums), max(nums)


def _strip_html(text: str) -> str:
    """Remove HTML tags and decode HTML entities."""
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _normalize_az(az: dict) -> dict | None:
    """Convert one raw Adzuna job into our normalized job dict, or None if it
    lacks an external id."""
    external_id = str(az.get("id", "")).strip()
    if not external_id:
        return None
    lo, hi = _salary_bounds(az)
    return {
        "external_id": external_id,
        "title": az.get("title", "").strip(),
        "company": az.get("company", {}).get("display_name", "Unknown"),
        "location": az.get("location", {}).get("display_name", "Remote"),
        "description": _strip_html(az.get("description", "")),
        "salary_range": _format_salary(az),
        "salary_min_value": lo,
        "salary_max_value": hi,
        "department": CATEGORY_TO_DEPT.get(az.get("category", {}).get("tag", ""), "engineering"),
        "seniority": _infer_seniority(az.get("title", "")),
        "external_url": az.get("redirect_url", ""),
        "source": "adzuna",
    }


def _dedupe(normalized: list[dict]) -> list[dict]:
    """Drop duplicate (title, company) pairs — Adzuna reposts the same job
    across many locations."""
    seen: set[tuple[str, str]] = set()
    out: list[dict] = []
    for n in normalized:
        key = (n["title"].lower(), n["company"].lower())
        if key not in seen:
            seen.add(key)
            out.append(n)
    return out


def _cosine_sim(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _clean_keywords(keywords: str) -> str:
    """Normalize keywords for Adzuna: replace underscores, strip special chars."""
    keywords = keywords.replace("_", " ")
    # Handle C++ / C# explicitly before stripping
    keywords = keywords.replace("C++", "C plus plus").replace("C#", "C sharp")
    # Remove remaining special characters
    keywords = re.sub(r"[+#@&]", "", keywords)
    # Drop single-character tokens (e.g. bare "C" left over from failed substitutions)
    tokens = [t for t in keywords.split() if len(t) > 1]
    keywords = " ".join(tokens)
    return keywords.strip()


async def _fetch_page(client: httpx.AsyncClient, keywords: str, country: str, page: int, per_page: int) -> list[dict]:
    """Fetch a single page of Adzuna results."""
    clean = _clean_keywords(keywords)
    url = f"{ADZUNA_BASE}/{country}/search/{page}"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": clean,
        "results_per_page": per_page,
    }
    try:
        resp = await client.get(url, params=params)
        print(f"[Adzuna] GET {url} p{page} what='{clean}' → {resp.status_code}")
        if resp.status_code != 200:
            return []
        data = resp.json()
        return data.get("results", [])
    except Exception as e:
        print(f"[Adzuna] Exception page {page}: {e}")
        return []


async def _fetch_raw(keywords: str, country: str, per_page: int = 50, pages: int = 3) -> list[dict]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        print("[Adzuna] No credentials configured — skipping")
        return []
    async with httpx.AsyncClient(timeout=15) as client:
        page_results = await asyncio.gather(
            *[_fetch_page(client, keywords, country, p, per_page) for p in range(1, pages + 1)]
        )
    all_results = [job for page in page_results for job in page]
    print(f"[Adzuna] Total raw results for '{keywords}': {len(all_results)}")
    return all_results


def _normalize_score(cosine_sim: float, skills: list[str], job_text: str) -> float:
    """Normalize cosine similarity to a user-friendly 0–100 score with keyword boost."""
    SIM_LOW, SIM_HIGH = 0.15, 0.65
    sim_score = max(0.0, min(100.0, (cosine_sim - SIM_LOW) / (SIM_HIGH - SIM_LOW) * 100))
    if skills:
        job_lower = job_text.lower()
        hits = sum(1 for s in skills if len(s) > 1 and s.lower() in job_lower)
        kw_score = min(20.0, hits / max(len(skills), 1) * 40.0)
    else:
        kw_score = 0.0
    return round(min(100.0, sim_score * 0.85 + kw_score), 1)


async def fetch_and_store_adzuna_jobs(
    keywords: str,
    resume_embedding: list[float],
    db: AsyncSession,
    country: str = "us",
    skills: list[str] | None = None,
) -> list[dict]:
    """
    1. Fetch jobs from Adzuna using keywords extracted from the resume (3 pages × 50).
    2. Upsert new jobs into the DB (existing ones are skipped).
    3. Compute cosine similarity score vs the resume embedding.
    4. Return a list of job dicts with match_score, ready to merge with DB results.
    """
    raw_jobs = await _fetch_raw(keywords, country, per_page=50, pages=3)
    if not raw_jobs:
        return []

    # Normalize + deduplicate all Adzuna jobs
    normalized = _dedupe([n for az in raw_jobs if (n := _normalize_az(az))])
    if not normalized:
        return []

    # Find which external_ids already exist
    external_ids = [n["external_id"] for n in normalized]
    existing_result = await db.execute(
        select(Job.external_id).where(Job.external_id.in_(external_ids))
    )
    existing_ids = {row[0] for row in existing_result.all()}

    # Embed and insert only new jobs (in parallel, capped to avoid rate limits)
    new_jobs_data = [n for n in normalized if n["external_id"] not in existing_ids]

    if new_jobs_data:
        embed_texts = [
            f"{j['title']} at {j['company']}. {j['description']}"[:8000]
            for j in new_jobs_data
        ]
        # Embed in batches of 10
        batch_size = 10
        all_embeddings: list[list[float] | None] = []
        for i in range(0, len(embed_texts), batch_size):
            batch = embed_texts[i : i + batch_size]
            results_batch = await asyncio.gather(
                *[get_embedding(t) for t in batch], return_exceptions=True
            )
            for emb in results_batch:
                all_embeddings.append(emb if not isinstance(emb, Exception) else None)

        for job_data, emb in zip(new_jobs_data, all_embeddings):
            job = Job(
                title=job_data["title"],
                company=job_data["company"],
                location=job_data["location"],
                description=job_data["description"],
                salary_range=job_data["salary_range"],
                salary_min_value=job_data["salary_min_value"],
                salary_max_value=job_data["salary_max_value"],
                department=job_data["department"],
                seniority=job_data["seniority"],
                external_url=job_data["external_url"],
                external_id=job_data["external_id"],
                source="adzuna",
                embedding=emb,
            )
            db.add(job)

        await db.commit()

    # Fetch all (new + existing) jobs for this batch to get their IDs/embeddings
    all_result = await db.execute(
        select(Job).where(Job.external_id.in_(external_ids))
    )
    all_jobs = all_result.scalars().all()

    # Score each job against the resume embedding
    job_dicts: list[dict] = []
    for job in all_jobs:
        cosine_sim = _cosine_sim(resume_embedding, list(job.embedding) if job.embedding is not None else [])
        job_text = f"{job.title} {job.description}"
        score = _normalize_score(cosine_sim, skills or [], job_text)
        job_dicts.append({
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "description": job.description,
            "location": job.location,
            "department": job.department,
            "seniority": job.seniority,
            "salary_range": job.salary_range,
            "posted_date": job.posted_date,
            "match_score": score,
            "external_url": job.external_url,
            "source": job.source,
        })

    return job_dicts


# Keyword sets used for startup seeding — broad enough to yield many unique results
_SEED_KEYWORDS = [
    "software engineer",
    "data scientist",
    "product manager",
    "frontend developer",
    "backend developer",
    "machine learning engineer",
    "devops engineer",
    "marketing manager",
    "financial analyst",
    "UX designer",
    "software engineering intern",
    "data science intern",
    "product intern",
    "marketing intern",
]


async def fetch_store_keyword(db: AsyncSession, keyword: str, country: str = "us", pages: int = 1) -> list[Job]:
    """Fetch one keyword from Adzuna, store any genuinely new jobs, and return
    the newly inserted Job rows. Shared by startup seeding and the periodic
    live-feed refresh."""
    raw_jobs = await _fetch_raw(keyword, country, per_page=50, pages=pages)
    if not raw_jobs:
        return []

    deduped = _dedupe([n for az in raw_jobs if (n := _normalize_az(az))])
    if not deduped:
        return []

    # Skip already-stored external_ids
    ext_ids = [n["external_id"] for n in deduped]
    existing = {
        row[0]
        for row in (await db.execute(select(Job.external_id).where(Job.external_id.in_(ext_ids)))).all()
    }
    new_data = [n for n in deduped if n["external_id"] not in existing]
    if not new_data:
        return []

    # Embed in batches of 10
    embed_texts = [f"{j['title']} at {j['company']}. {j['description']}"[:8000] for j in new_data]
    all_embeddings: list[list[float] | None] = []
    for i in range(0, len(embed_texts), 10):
        batch = embed_texts[i: i + 10]
        results_batch = await asyncio.gather(*[get_embedding(t) for t in batch], return_exceptions=True)
        for emb in results_batch:
            all_embeddings.append(emb if not isinstance(emb, Exception) else None)

    inserted: list[Job] = []
    for job_data, emb in zip(new_data, all_embeddings):
        job = Job(
            title=job_data["title"],
            company=job_data["company"],
            location=job_data["location"],
            description=job_data["description"],
            salary_range=job_data["salary_range"],
            salary_min_value=job_data["salary_min_value"],
            salary_max_value=job_data["salary_max_value"],
            department=job_data["department"],
            seniority=job_data["seniority"],
            external_url=job_data["external_url"],
            external_id=job_data["external_id"],
            source="adzuna",
            embedding=emb,
        )
        db.add(job)
        inserted.append(job)

    await db.commit()
    for job in inserted:
        await db.refresh(job)
    print(f"[Adzuna] '{keyword}' → {len(inserted)} new jobs stored")
    return inserted


async def seed_jobs_from_adzuna(db: AsyncSession, country: str = "us") -> int:
    """
    Fetch a broad set of jobs at startup so the browse page has content even
    before any resume is uploaded.  Uses 1 page × 50 per keyword to stay well
    within the Adzuna free-tier 250 req/day limit (14 requests total).
    Returns the number of new jobs inserted.
    """
    total_inserted = 0
    for kw in _SEED_KEYWORDS:
        inserted = await fetch_store_keyword(db, kw, country, pages=1)
        total_inserted += len(inserted)
    return total_inserted
