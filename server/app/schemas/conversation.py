from pydantic import BaseModel, Field
from datetime import datetime


class ConversationCreate(BaseModel):
    title: str | None = Field(default="New Chat", max_length=150)


class ConversationUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=150)


class ConversationOut(BaseModel):
    id: int
    title: str
    model_used: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}