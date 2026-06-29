"""
Single shared AsyncOpenAI client.

Instantiating AsyncOpenAI per-request opens a fresh HTTP connection pool every
time, which is wasteful and slow under load. Every module that needs OpenAI
should import `client` from here so connections are pooled and reused.
"""

from openai import AsyncOpenAI
from config import OPENAI_API_KEY

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

EMBEDDING_MODEL = "text-embedding-3-small"
