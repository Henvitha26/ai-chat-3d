from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import settings


# ---------------------------------------------------------------
# PASSWORD HASHING (bcrypt)
# ---------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    # bcrypt has a 72-byte limit — truncate safely
    return pwd_context.hash(password[:72])


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plain password against a stored hash."""
    return pwd_context.verify(plain[:72], hashed)


# ---------------------------------------------------------------
# JWT TOKENS
# ---------------------------------------------------------------
def _create_token(user_id: int, token_type: str, expires_delta: timedelta) -> str:
    """Internal helper to build a JWT."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),        # subject = user id (must be string per JWT spec)
        "type": token_type,          # "access" or "refresh"
        "iat": now,                  # issued at
        "exp": now + expires_delta,  # expiration
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: int) -> str:
    """Short-lived token used to call protected APIs."""
    return _create_token(
        user_id,
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int) -> str:
    """Long-lived token used to renew the access token."""
    return _create_token(
        user_id,
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    """Decode & verify a JWT. Raises ValueError if invalid/expired."""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")