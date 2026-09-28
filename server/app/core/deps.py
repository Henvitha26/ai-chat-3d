from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.models.user import User


# Simple Bearer token — Swagger shows a plain "paste token" box
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract & validate user from the Bearer token."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        payload = decode_token(token)
    except ValueError:
        raise credentials_error

    if payload.get("type") != "access":
        raise credentials_error

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        raise credentials_error

    try:
        user_id = int(user_id_raw)
    except (TypeError, ValueError):
        raise credentials_error

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_error

    return user