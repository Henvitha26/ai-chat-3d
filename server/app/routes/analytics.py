from fastapi import APIRouter, Depends
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date

from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.voice_log import VoiceLog
from app.core.deps import get_current_user


router = APIRouter(prefix="/analytics", tags=["analytics"])


# ---------------------------------------------------------------
# KPIs — top of dashboard
# ---------------------------------------------------------------
@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
    total_messages = db.query(func.count(Message.id)).scalar() or 0
    total_voice = db.query(func.count(VoiceLog.id)).scalar() or 0

    # Calculate % change vs last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    two_weeks_ago = datetime.utcnow() - timedelta(days=14)

    users_last_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
    users_prev_week = (
        db.query(func.count(User.id))
        .filter(User.created_at >= two_weeks_ago, User.created_at < week_ago)
        .scalar() or 0
    )
    user_growth = 0
    if users_prev_week > 0:
        user_growth = ((users_last_week - users_prev_week) / users_prev_week) * 100

    return {
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_voice": total_voice,
        "user_growth_pct": round(user_growth, 1),
    }


# ---------------------------------------------------------------
# Messages over time (last 30 days)
# ---------------------------------------------------------------
@router.get("/messages-timeline")
def get_messages_timeline(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(
            func.date(Message.created_at).label("day"),
            func.count(Message.id).label("count"),
        )
        .filter(Message.created_at >= since)
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at))
        .all()
    )

    # Fill missing days with zero
    today = date.today()
    data_by_day = {row.day.isoformat() if isinstance(row.day, date) else str(row.day): row.count for row in rows}
    result = []
    for i in range(days - 1, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        result.append({"date": d, "messages": data_by_day.get(d, 0)})
    return result


# ---------------------------------------------------------------
# Voice vs Text split
# ---------------------------------------------------------------
@router.get("/voice-split")
def get_voice_split(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stt = db.query(func.count(VoiceLog.id)).filter(VoiceLog.type == "stt").scalar() or 0
    tts = db.query(func.count(VoiceLog.id)).filter(VoiceLog.type == "tts").scalar() or 0
    total_messages = db.query(func.count(Message.id)).scalar() or 0

    return {
        "voice_stt": stt,
        "voice_tts": tts,
        "total_messages": total_messages,
        "voice_pct": round(((stt + tts) / max(total_messages, 1)) * 100, 1),
    }


# ---------------------------------------------------------------
# Top users (by message count)
# ---------------------------------------------------------------
@router.get("/top-users")
def get_top_users(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(
            User.username,
            func.count(Message.id).label("message_count"),
        )
        .join(Conversation, Conversation.user_id == User.id)
        .join(Message, Message.conversation_id == Conversation.id)
        .group_by(User.id)
        .order_by(func.count(Message.id).desc())
        .limit(limit)
        .all()
    )
    return [{"username": r.username, "messages": r.message_count} for r in rows]


# ---------------------------------------------------------------
# Model usage
# ---------------------------------------------------------------
@router.get("/model-usage")
def get_model_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(
            Conversation.model_used,
            func.count(Conversation.id).label("count"),
        )
        .group_by(Conversation.model_used)
        .all()
    )
    return [{"model": r.model_used or "unknown", "count": r.count} for r in rows]


# ---------------------------------------------------------------
# Hourly activity heatmap
# ---------------------------------------------------------------
@router.get("/activity-heatmap")
def get_activity_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(
            func.hour(Message.created_at).label("hour"),
            func.count(Message.id).label("count"),
        )
        .group_by(func.hour(Message.created_at))
        .order_by(func.hour(Message.created_at))
        .all()
    )

    by_hour = {r.hour: r.count for r in rows}
    return [{"hour": h, "messages": by_hour.get(h, 0)} for h in range(24)]