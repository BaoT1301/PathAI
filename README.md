<div align="center">

<br />

![PathAI](https://img.shields.io/badge/PathAI-0051d5?style=for-the-badge&labelColor=000000&color=0051d5)

### AI-powered job matching that analyzes your resume and surfaces roles that fit your trajectory — not just your keywords.

<br />

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python_3.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Overview

PathAI is a full-stack job platform where candidates upload a resume and receive AI-ranked job matches. The matching engine combines GPT-4o-mini structured extraction with pgvector cosine similarity to surface roles that are genuinely relevant — correctly levelled by seniority, ranked by semantic fit.

Built as a portfolio project demonstrating vector search, AI-driven personalization, and a polished multi-page product experience.

---

## Features

| Feature | Description |
|---|---|
| **Resume Matching** | Upload PDF/DOCX — GPT-4o-mini extracts your profile, pgvector ranks jobs by semantic similarity |
| **Personalized Match Scores** | Every job detail page computes your cosine similarity score on demand against your resume embedding |
| **Apply Flow** | External job links open the posting then prompt "Did you apply?" — confirmed applications land in your dashboard |
| **ATS Dashboard** | Track applications across stages: Applied → Phone Screen → Interview → Offer → Hired |
| **Saved Jobs** | Bookmark any job from the feed; saved roles appear in a dedicated dashboard section |
| **Interview Prep** | Role-specific interview questions generated per job |
| **Company Logos** | Clearbit logo API on all job cards with letter-initial fallback |
| **Authentication** | Supabase Auth with email/password, email confirmation flow, and protected routes |

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

Each job stores a pre-computed pgvector embedding of its title and description. The resume text is embedded at upload time via `text-embedding-3-small`. Cosine distance is computed in-database and the top matches are returned from the already-filtered pool.

The result: semantically relevant roles, correctly levelled.

---

## Architecture

```
┌──────────────────────┐         ┌──────────────────────┐
│   Next.js 16         │ ──────► │   FastAPI Backend    │
│   (Vercel)           │ ◄────── │   (Railway)          │
└──────────────────────┘         └──────────┬───────────┘
                                            │
                                            ▼
                                  ┌──────────────────────┐
                                  │  Supabase            │
                                  │  PostgreSQL + pgvector│
                                  └──────────┬───────────┘
                                            │
                                            ▼
                                  ┌──────────────────────┐
                                  │  OpenAI API          │
                                  │  text-embedding-3-   │
                                  │  small + gpt-4o-mini │
                                  └──────────────────────┘
```

---

## Tech Stack

**Frontend**

| | Library | Purpose |
|---|---|---|
| [![Next.js](https://img.shields.io/badge/-Next.js_16-000?style=flat-square&logo=next.js)](https://nextjs.org) | Next.js 16 | App Router, SSR, routing |
| [![React](https://img.shields.io/badge/-React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev) | React 19 | UI framework |
| [![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org) | TypeScript | Type safety |
| [![Tailwind](https://img.shields.io/badge/-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com) | Tailwind CSS | Styling |
| [![Framer](https://img.shields.io/badge/-Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)](https://framer.com/motion) | Framer Motion | Animations |

**Backend**

| | Library | Purpose |
|---|---|---|
| [![FastAPI](https://img.shields.io/badge/-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com) | FastAPI | REST API |
| [![Python](https://img.shields.io/badge/-Python_3.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org) | Python 3.14 | Runtime |
| [![SQLAlchemy](https://img.shields.io/badge/-SQLAlchemy-CC2927?style=flat-square&logo=sqlalchemy&logoColor=white)](https://sqlalchemy.org) | SQLAlchemy 2 | ORM |

**Data & AI**

| | Service | Purpose |
|---|---|---|
| [![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com) | Supabase | PostgreSQL, Auth |
| [![pgvector](https://img.shields.io/badge/-pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector) | pgvector | Vector similarity search |
| [![OpenAI](https://img.shields.io/badge/-OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com) | OpenAI | Embeddings + extraction |

---

## Project Structure

```
PathAI/
├── frontend/                        # Next.js 16 — App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Landing page
│       │   ├── jobs/page.tsx        # Job listings with filters + pagination
│       │   ├── jobs/[id]/page.tsx   # Job detail + AI Match Analysis widget
│       │   ├── resume/page.tsx      # Resume upload + profile analysis
│       │   ├── dashboard/page.tsx   # ATS dashboard, saved jobs, applications
│       │   ├── about/page.tsx       # About / how it works
│       │   └── auth/page.tsx        # Sign in / sign up
│       ├── components/
│       │   └── CompanyLogo.tsx      # Clearbit logo with letter-initial fallback
│       ├── context/
│       │   └── AuthContext.tsx      # Supabase session management
│       └── lib/
│           ├── api.ts               # All API calls (jobs, resume, match score, saved)
│           └── supabase.ts          # Supabase client
│
└── backend/                         # FastAPI (Python)
    ├── main.py                      # All routes + middleware
    ├── models.py                    # SQLAlchemy ORM models
    ├── schemas.py                   # Pydantic request / response schemas
    ├── auth.py                      # Supabase JWT verification
    ├── seed_data.py                 # Synthetic job generator
    └── services/
        ├── matching.py              # Dual-layer matching logic
        ├── resume_parser.py         # PDF/DOCX extraction + GPT-4o-mini parsing
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
python seed_data.py        # Populate DB with synthetic jobs
uvicorn main:app --reload  # http://localhost:8000
```

**`backend/.env`**

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
npm run dev    # http://localhost:3000
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

<div align="center">
<sub>© 2026 PathAI</sub>
</div>
