import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET

security = HTTPBearer(auto_error=False)

# Shared async client (connection-pooled, reused across requests)
_http_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=10)
    return _http_client


def _verify_jwt_locally(token: str) -> dict | None:
    """Verify a Supabase access token locally using the project JWT secret.
    Returns the user dict (with 'sub' = user id) or None if verification fails.
    Returns None (rather than raising) so callers can fall back to the network
    path when the secret isn't configured."""
    if not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    if "sub" not in payload:
        return None
    return {"sub": payload["sub"], **payload}


async def _verify_via_supabase(token: str) -> dict:
    """Fallback: validate the token by calling Supabase's auth API."""
    client = get_http_client()
    try:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
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
    return {"sub": user_data["id"], **user_data}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict | None:
    """Validates the Supabase access token. Prefers fast local JWT verification
    (no network hop); falls back to Supabase's auth API if no JWT secret is set.
    Returns the user dict (with 'sub' = user id) or None if not authenticated."""
    if not credentials:
        return None

    local = _verify_jwt_locally(credentials.credentials)
    if local is not None:
        return local

    return await _verify_via_supabase(credentials.credentials)


async def get_current_user_soft(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict | None:
    """Like get_current_user, but never raises — returns None for missing,
    invalid, or expired tokens. Use on public endpoints that *optionally*
    personalize for a signed-in user (e.g. ranked job browsing), so a stale
    token degrades gracefully to the anonymous experience instead of a 401."""
    if not credentials:
        return None
    try:
        local = _verify_jwt_locally(credentials.credentials)
        if local is not None:
            return local
        return await _verify_via_supabase(credentials.credentials)
    except Exception:
        return None


async def require_auth(user: dict | None = Depends(get_current_user)) -> dict:
    """Raises 401 if not authenticated. Use as a dependency on protected routes."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user
