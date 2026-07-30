import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Startup behavior flags (default OFF = non-destructive boots). Ingestion should
# run as a scheduled job (see ingest.py), not on every web-process start.
# - SEED_ON_START: run the Adzuna seed on boot (useful for a fresh/empty DB).
# - RESET_JOBS_ON_START: run the delete-internal + de-dup cleanup on boot.
SEED_ON_START = os.getenv("SEED_ON_START", "false").lower() == "true"
RESET_JOBS_ON_START = os.getenv("RESET_JOBS_ON_START", "false").lower() == "true"

# Startup validation — warn loudly if critical env vars are missing
_required = {
    "DATABASE_URL": DATABASE_URL,
    "OPENAI_API_KEY": OPENAI_API_KEY,
    "SUPABASE_URL": SUPABASE_URL,
    "SUPABASE_ANON_KEY": SUPABASE_ANON_KEY,
}
for _name, _val in _required.items():
    if not _val:
        print(f"[Config] WARNING: {_name} is not set — dependent features will fail")
