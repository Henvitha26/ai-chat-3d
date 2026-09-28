from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationOut,
)
from app.schemas.message import MessageOut
from app.core.deps import get_current_user


router = APIRouter(prefix="/conversations", tags=["conversations"])


# ---------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------
@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = Conversation(
        user_id=current_user.id,
        title=payload.title or "New Chat",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


# ---------------------------------------------------------------
# LIST (my conversations, newest first)
# ---------------------------------------------------------------
@router.get("", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


# ---------------------------------------------------------------
# Helper — fetch one conversation with ownership check
# ---------------------------------------------------------------
def _get_owned_conversation(
    conversation_id: int,
    db: Session,
    current_user: User,
) -> Conversation:
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    if conv.user_id != current_user.id:
        # Same 404 to avoid leaking whether the id exists
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    return conv


# ---------------------------------------------------------------
# GET ONE (with messages)
# ---------------------------------------------------------------
@router.get("/{conversation_id}", response_model=dict)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _get_owned_conversation(conversation_id, db, current_user)
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return {
        "conversation": ConversationOut.model_validate(conv),
        "messages": [MessageOut.model_validate(m) for m in messages],
    }


# ---------------------------------------------------------------
# UPDATE (rename)
# ---------------------------------------------------------------
@router.patch("/{conversation_id}", response_model=ConversationOut)
def update_conversation(
    conversation_id: int,
    payload: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _get_owned_conversation(conversation_id, db, current_user)
    conv.title = payload.title
    db.commit()
    db.refresh(conv)
    return conv


# ---------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------
@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _get_owned_conversation(conversation_id, db, current_user)
    db.delete(conv)   # cascade deletes messages via FK
    db.commit()
    return None