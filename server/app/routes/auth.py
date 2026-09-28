from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.auth import TokenPair, RefreshRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.deps import get_current_user
from app.config import settings


router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check duplicates
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------
@router.post("/login", response_model=TokenPair)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Verify credentials and return an access + refresh token pair."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Store refresh token in DB for revocation support
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db.add(
        RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
        )
    )
    db.commit()

    return TokenPair(access_token=access_token, refresh_token=refresh_token)


# ---------------------------------------------------------------
# REFRESH
# ---------------------------------------------------------------
@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh pair (rotation)."""
    # 1. Decode & validate the token
    try:
        data = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not a refresh token",
        )

    # 2. Confirm the token exists in DB and isn't revoked
    stored = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == payload.refresh_token,
            RefreshToken.revoked.is_(False),
        )
        .first()
    )
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or unknown",
        )

    # 3. Revoke the old one (rotation)
    stored.revoked = True

    # 4. Issue a fresh pair
    user_id = int(data["sub"])
    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)

    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db.add(
        RefreshToken(
            user_id=user_id,
            token=new_refresh,
            expires_at=expires_at,
        )
    )
    db.commit()

    return TokenPair(access_token=new_access, refresh_token=new_refresh)


# ---------------------------------------------------------------
# ME (current user)
# ---------------------------------------------------------------
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user