import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import SUPABASE_URL, SUPABASE_ANON_KEY

security = HTTPBearer(auto_error=False)

# Shared async client (connection-pooled, reused across requests)
_http_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=10)
    return _http_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict | None:
    """Validates the Supabase access token via Supabase's own auth API.
    Returns the user dict (with 'sub' = user id) or None if not authenticated."""
    if not credentials:
        return None

    client = get_http_client()
    try:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {credentials.credentials}",
                "apikey": SUPABASE_ANON_KEY,
            },
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Auth service unreachable: {e}",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_data = resp.json()
    # Normalise to the same shape the rest of the app expects: user["sub"] = user id
    return {"sub": user_data["id"], **user_data}


async def require_auth(user: dict | None = Depends(get_current_user)) -> dict:
    """Raises 401 if not authenticated. Use as a dependency on protected routes."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user
