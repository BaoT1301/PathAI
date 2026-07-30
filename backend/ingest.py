"""Standalone job-ingestion entry point.

Run this as a scheduled job (e.g. a Railway cron service) instead of seeding
inside the web process on every boot:

    python ingest.py

It fetches and stores new Adzuna jobs using the same pipeline the API uses,
then exits. Decoupling ingestion from the web process keeps request latency
stable and means a slow/failed fetch can never stall or crash the site.
"""

import asyncio

from database import async_session
from services.adzuna_client import seed_jobs_from_adzuna


async def main() -> None:
    async with async_session() as session:
        added = await seed_jobs_from_adzuna(session)
        print(f"[ingest] complete — {added} new jobs added")


if __name__ == "__main__":
    asyncio.run(main())
