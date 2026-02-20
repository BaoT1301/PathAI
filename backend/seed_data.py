"""
Seed script to generate ~100 synthetic jobs with embeddings.
Run: python seed_data.py
"""

import asyncio
import uuid
import json
from datetime import datetime, timezone, timedelta
import random
from openai import AsyncOpenAI
from sqlalchemy import text
from database import engine, async_session, Base
from models import Job
from config import OPENAI_API_KEY

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

DEPARTMENTS = [
    "engineering",
    "data_science",
    "product",
    "design",
    "marketing",
    "sales",
    "finance",
    "hr",
    "operations",
    "healthcare",
]

SENIORITY_LEVELS = ["intern", "junior", "mid", "senior", "lead", "director", "vp", "c-suite"]

LOCATIONS = [
    "San Francisco, CA",
    "New York, NY",
    "Austin, TX",
    "Seattle, WA",
    "Chicago, IL",
    "Boston, MA",
    "Los Angeles, CA",
    "Denver, CO",
    "Miami, FL",
    "Remote",
]

# Salary ranges by seniority (approximate)
SALARY_RANGES = {
    "intern": "$40,000 - $60,000",
    "junior": "$60,000 - $90,000",
    "mid": "$90,000 - $130,000",
    "senior": "$130,000 - $180,000",
    "lead": "$160,000 - $210,000",
    "director": "$190,000 - $260,000",
    "vp": "$250,000 - $350,000",
    "c-suite": "$300,000 - $500,000+",
}

JOB_TEMPLATES = {
    "engineering": [
        "Software Engineer",
        "Backend Engineer",
        "Frontend Engineer",
        "Full Stack Developer",
        "DevOps Engineer",
        "Site Reliability Engineer",
        "Mobile Developer",
        "Platform Engineer",
        "Security Engineer",
        "QA Engineer",
    ],
    "data_science": [
        "Data Scientist",
        "Machine Learning Engineer",
        "Data Analyst",
        "Data Engineer",
        "AI Research Scientist",
        "Business Intelligence Analyst",
        "NLP Engineer",
        "Analytics Engineer",
    ],
    "product": [
        "Product Manager",
        "Technical Program Manager",
        "Product Analyst",
        "Product Operations Manager",
        "Growth Product Manager",
    ],
    "design": [
        "UX Designer",
        "UI Designer",
        "Product Designer",
        "UX Researcher",
        "Design Systems Engineer",
        "Visual Designer",
    ],
    "marketing": [
        "Marketing Manager",
        "Content Strategist",
        "Growth Marketing Manager",
        "Brand Manager",
        "SEO Specialist",
        "Email Marketing Manager",
    ],
    "sales": [
        "Account Executive",
        "Sales Development Representative",
        "Enterprise Account Manager",
        "Sales Engineer",
        "Customer Success Manager",
    ],
    "finance": [
        "Financial Analyst",
        "Accountant",
        "Controller",
        "FP&A Analyst",
        "Treasury Analyst",
        "Tax Specialist",
    ],
    "hr": [
        "HR Business Partner",
        "Recruiter",
        "Talent Acquisition Specialist",
        "People Operations Manager",
        "Compensation Analyst",
    ],
    "operations": [
        "Operations Manager",
        "Supply Chain Analyst",
        "Project Manager",
        "Business Operations Analyst",
        "Logistics Coordinator",
    ],
    "healthcare": [
        "Registered Nurse",
        "Clinical Research Associate",
        "Healthcare Administrator",
        "Medical Technologist",
        "Pharmacist",
        "Physical Therapist",
    ],
}

SENIORITY_PREFIXES = {
    "intern": "Intern -",
    "junior": "Junior",
    "mid": "",
    "senior": "Senior",
    "lead": "Lead",
    "director": "Director of",
    "vp": "VP of",
    "c-suite": "Chief",
}


def generate_title(base_title: str, seniority: str) -> str:
    prefix = SENIORITY_PREFIXES[seniority]
    if seniority == "intern":
        return f"{base_title} Intern"
    if seniority == "c-suite":
        # Map to C-suite titles
        dept_chief = {
            "engineering": "Chief Technology Officer (CTO)",
            "data_science": "Chief Data Officer (CDO)",
            "product": "Chief Product Officer (CPO)",
            "design": "Chief Design Officer",
            "marketing": "Chief Marketing Officer (CMO)",
            "sales": "Chief Revenue Officer (CRO)",
            "finance": "Chief Financial Officer (CFO)",
            "hr": "Chief People Officer (CPO)",
            "operations": "Chief Operating Officer (COO)",
            "healthcare": "Chief Medical Officer (CMO)",
        }
        return dept_chief.get("engineering", f"Chief {base_title}")
    if seniority == "director":
        return f"Director of {base_title.replace('Manager', 'Management').replace('Engineer', 'Engineering')}"
    if seniority == "vp":
        return f"VP of {base_title.replace('Manager', 'Management').replace('Engineer', 'Engineering')}"
    if prefix:
        return f"{prefix} {base_title}"
    return base_title


async def generate_description(title: str, department: str, seniority: str) -> str:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Generate a realistic job description (150-250 words) for the given position. "
                    "Include: role overview, key responsibilities (3-5 bullet points), "
                    "required qualifications, and nice-to-haves. Be specific and realistic. "
                    "Do not include the job title in your response — just the description body."
                ),
            },
            {
                "role": "user",
                "content": f"Title: {title}\nDepartment: {department}\nSeniority: {seniority}",
            },
        ],
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


async def get_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


async def seed():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

    jobs_to_create = []

    # Generate a balanced mix: ~100 jobs across departments and seniority levels
    for department, titles in JOB_TEMPLATES.items():
        # Pick a subset of titles for each department
        selected_titles = random.sample(titles, min(len(titles), 3))
        for base_title in selected_titles:
            # Assign 1-2 seniority levels per title
            seniority_levels = random.sample(
                ["junior", "mid", "senior", "lead"],
                k=random.randint(1, 2),
            )
            for seniority in seniority_levels:
                title = generate_title(base_title, seniority)
                location = random.choice(LOCATIONS)
                salary = SALARY_RANGES[seniority]
                posted_days_ago = random.randint(1, 60)
                posted_date = datetime.now(timezone.utc) - timedelta(days=posted_days_ago)

                jobs_to_create.append({
                    "title": title,
                    "department": department,
                    "seniority": seniority,
                    "location": location,
                    "salary_range": salary,
                    "posted_date": posted_date,
                })

    # Also add a few director/vp/c-suite and intern roles
    for department in random.sample(DEPARTMENTS, 5):
        titles = JOB_TEMPLATES[department]
        base = random.choice(titles)
        for seniority in ["intern", "director", "vp"]:
            title = generate_title(base, seniority)
            jobs_to_create.append({
                "title": title,
                "department": department,
                "seniority": seniority,
                "location": random.choice(LOCATIONS),
                "salary_range": SALARY_RANGES[seniority],
                "posted_date": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
            })

    print(f"Generating {len(jobs_to_create)} jobs...")

    # Generate descriptions and embeddings in batches
    batch_size = 5
    all_jobs = []

    for i in range(0, len(jobs_to_create), batch_size):
        batch = jobs_to_create[i : i + batch_size]
        print(f"Processing batch {i // batch_size + 1}/{(len(jobs_to_create) + batch_size - 1) // batch_size}...")

        # Generate descriptions in parallel
        descriptions = await asyncio.gather(
            *[generate_description(j["title"], j["department"], j["seniority"]) for j in batch]
        )

        # Generate embeddings in parallel
        embed_texts = [f"{j['title']}. {desc}" for j, desc in zip(batch, descriptions)]
        embeddings = await asyncio.gather(*[get_embedding(t) for t in embed_texts])

        for j, desc, emb in zip(batch, descriptions, embeddings):
            all_jobs.append(
                Job(
                    id=uuid.uuid4(),
                    title=j["title"],
                    description=desc,
                    location=j["location"],
                    department=j["department"],
                    seniority=j["seniority"],
                    salary_range=j["salary_range"],
                    posted_date=j["posted_date"],
                    embedding=emb,
                )
            )

    # Insert all jobs
    async with async_session() as session:
        # Clear existing jobs
        await session.execute(text("DELETE FROM jobs"))
        session.add_all(all_jobs)
        await session.commit()

    print(f"Seeded {len(all_jobs)} jobs successfully!")

    # Print summary
    dept_counts = {}
    sen_counts = {}
    for j in all_jobs:
        dept_counts[j.department] = dept_counts.get(j.department, 0) + 1
        sen_counts[j.seniority] = sen_counts.get(j.seniority, 0) + 1

    print("\nBy department:")
    for dept, count in sorted(dept_counts.items()):
        print(f"  {dept}: {count}")

    print("\nBy seniority:")
    for sen, count in sorted(sen_counts.items()):
        print(f"  {sen}: {count}")


if __name__ == "__main__":
    asyncio.run(seed())
