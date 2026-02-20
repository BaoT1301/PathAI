<div align="center">

# PathAI

**AI-powered career platform that matches candidates to roles using resume analysis and vector similarity search**

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

## Overview

PathAI is a full-stack job platform where candidates upload a resume and receive AI-ranked job matches. The matching engine combines structured seniority pre-filtering with pgvector cosine similarity search to surface roles that are genuinely relevant — not just keyword matches.

Built as a portfolio project demonstrating real-time systems, vector search, and multi-feature AI integration.

---

## Features

| Feature | Description |
|---|---|
| **Resume Matching** | Upload PDF/DOCX — GPT-4o-mini extracts your profile, pgvector ranks jobs by semantic fit |
| **Real-Time Job Feed** | WebSocket delivers new postings instantly to all connected clients |
| **ATS Dashboard** | Track applications across stages: Applied → Phone Screen → Interview → Offer → Hired |
| **AI Interview Coach** | Role-specific interview questions with tips, generated per job and resume |
| **Skills Gap Analysis** | Side-by-side view of required skills vs. yours for each matched role |
| **Cover Letter Generator** | One-click cover letter scoped to the job and your experience |
| **Salary Insights** | Market percentile comparison against similar roles in the same department |
| **Job Alerts** | Real-time push notifications when a new job matches saved preferences |
| **Authentication** | Supabase Auth with email/password, protected routes, session persistence |
| **Dark Mode** | Class-based toggle with localStorage persistence |

---

## How the Matching Works

Pure vector similarity has a well-known blind spot: a Junior Engineer and a VP of Engineering share nearly identical embeddings because the domain is the same. PathAI solves this with a two-layer approach.

**Layer 1 — Seniority Pre-Filter**

On resume upload, GPT-4o-mini extracts structured metadata:

```json
{
  "seniority": "senior",
  "domain": "software_engineering",
  "skills": ["python", "react", "aws"],
  "years_experience": 8
}
```

Jobs are filtered to only include roles within a compatible seniority band before any vector math runs. A mid-level engineer never sees intern or VP postings.

**Layer 2 — Vector Similarity**

Each job stores a pre-computed embedding of its title and description. The resume text is embedded at upload time. pgvector computes cosine similarity and returns the top matches from the already-filtered pool.

The result: semantically relevant roles, correctly levelled.

---

## Architecture

```
┌──────────────────────┐         ┌──────────────────────┐
│   Next.js Frontend   │ ──────► │   FastAPI Backend    │
│   (Vercel)           │ ◄────── │   (Railway)          │
└──────────────────────┘         └──────────┬───────────┘
          │                                 │
          │  WebSocket (/ws/jobs)           ▼
          └────────────────────►  ┌──────────────────────┐
                                  │  Supabase            │
                                  │  PostgreSQL + pgvector│
                                  └──────────────────────┘
                                           │
                                           ▼
                                  ┌──────────────────────┐
                                  │  OpenAI API          │
                                  │  text-embedding-3-   │
                                  │  small + gpt-4o-mini │
                                  └──────────────────────┘
```

---

## Project Structure

```
personalized-career-site/
│
├── frontend/                        # Next.js 16 — App Router
│   └── src/
│       ├── app/                     # Pages
│       │   ├── page.tsx             # Landing
│       │   ├── jobs/page.tsx        # Job listings + resume upload
│       │   ├── jobs/[id]/page.tsx   # Job detail
│       │   ├── dashboard/page.tsx   # ATS dashboard + saved jobs
│       │   ├── about/page.tsx       # About / how it works
│       │   └── auth/page.tsx        # Sign in / sign up
│       ├── components/              # Header, JobCard, ResumeUpload,
│       │                            # ProfileBanner, InterviewCoach,
│       │                            # CoverLetter, SalaryInsights, LiveIndicator
│       ├── context/                 # AuthContext, ThemeContext, NotificationsContext
│       ├── hooks/                   # useJobFeed — WebSocket job stream
│       └── lib/                     # api.ts, supabase.ts, utils.ts
│
└── backend/                         # FastAPI (Python)
    ├── main.py                      # All routes + WebSocket connection manager
    ├── models.py                    # SQLAlchemy ORM models
    ├── schemas.py                   # Pydantic request / response schemas
    ├── auth.py                      # Supabase JWT verification
    ├── seed_data.py                 # Synthetic job generator (500 jobs)
    └── services/
        ├── matching.py              # Dual-layer matching logic
        ├── resume_parser.py         # PDF/DOCX extraction + GPT parsing
        ├── skill_gap.py             # Skills comparison engine
        ├── interview_coach.py       # Interview question generation
        └── embedding.py             # OpenAI embeddings wrapper
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project (free tier works)
- OpenAI API key

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Configure environment variables (see backend/.env.example)
python seed_data.py        # Populates the DB with 500 synthetic jobs
uvicorn main:app --reload  # Runs on http://localhost:8000
```

**Environment variables:**

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_JWT_SECRET=
OPENAI_API_KEY=
DATABASE_URL=
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:3000
```

**Environment variables** (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```
