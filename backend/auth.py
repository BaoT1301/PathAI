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


# Cached JWKS client for verifying Supabase's asymmetric (ES256) access tokens.
_jwks_client: "jwt.PyJWKClient | None" = None


def _get_jwks_client() -> "jwt.PyJWKClient | None":
    """Lazily build a cached client for the project's JWKS endpoint, used to
    verify ES256/RS256 access tokens. Returns None if the project URL isn't
    configured (callers then fall back to the network verification path)."""
    global _jwks_client
    if not SUPABASE_URL:
        return None
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(
            f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json",
            lifespan=3600,  # signing keys rotate rarely; refetch at most hourly
        )
    return _jwks_client


def _verify_jwt_locally(token: str) -> dict | None:
    """Verify a Supabase access token locally.

    Supabase signs access tokens either with the legacy HS256 shared secret or,
    on newer projects, an asymmetric key (ES256) published via JWKS. We pick the
    verification path from the token's own ``alg`` header so both schemes work.
    Returns the user dict (with 'sub' = user id), or None to let the caller fall
    back to network verification (nothing configured, or JWKS unreachable)."""
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    try:
        if alg == "HS256":
            # Legacy symmetric secret. If unset, defer to the network path.
            if not SUPABASE_JWT_SECRET:
                return None
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        elif alg in ("ES256", "RS256"):
            # Modern asymmetric signing key: verify with the JWKS public key.
            client = _get_jwks_client()
            if client is None:
                return None
            signing_key = client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
            )
        else:
            # Unknown algorithm — defer to the network verification path.
            return None
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
    except Exception:
        # JWKS fetch/parse failure — don't hard-fail auth; let the network
        # verification path (Supabase /auth/v1/user) try instead.
        return None

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
