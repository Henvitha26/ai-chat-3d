from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


# ---------- INPUT: Register ----------
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


# ---------- INPUT: Login ----------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ---------- OUTPUT: Safe user info ----------
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}