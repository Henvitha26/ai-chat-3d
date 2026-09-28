from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageOut
from app.core.deps import get_current_user
from app.ml.llm import stream_chat, generate_title


router = APIRouter(prefix="/conversations", tags=["messages"])


def _get_owned_conversation(conversation_id, db, current_user):
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    return conv


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _get_owned_conversation(conversation_id, db, current_user)
    return (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = _get_owned_conversation(conversation_id, db, current_user)

    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=payload.content,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Detect first message
    user_msg_count = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv.id,
            Message.role == "user",
        )
        .count()
    )
    is_first_message = user_msg_count == 1
    needs_title = is_first_message and conv.title in (None, "", "New Chat")

    # Load history
    history = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    llm_messages = [{"role": m.role, "content": m.content} for m in history]

    conv_id = conv.id
    first_user_message = payload.content
    language = payload.language or "auto"

    async def event_stream():
        full_reply = ""
        try:
            async for token in stream_chat(llm_messages, language=language):
                full_reply += token
                safe = token.replace("\n", "\\n")
                yield f"data: {safe}\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
        finally:
            if full_reply.strip():
                session = SessionLocal()
                try:
                    assistant_msg = Message(
                        conversation_id=conv_id,
                        role="assistant",
                        content=full_reply,
                    )
                    session.add(assistant_msg)
                    c = session.get(Conversation, conv_id)
                    if c:
                        c.updated_at = datetime.utcnow()
                    session.commit()
                finally:
                    session.close()

            if needs_title:
                try:
                    title = await generate_title(first_user_message)
                    session = SessionLocal()
                    try:
                        c = session.get(Conversation, conv_id)
                        if c and c.title in (None, "", "New Chat"):
                            c.title = title
                            session.commit()
                        yield f"data: [TITLE] {title}\n\n"
                    finally:
                        session.close()
                except Exception:
                    pass

            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )