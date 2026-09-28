from pydantic import BaseModel, Field
from datetime import datetime


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    language: str | None = None   # "auto" | "en" | "hi" | "es" | etc.


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    audio_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}