from sqlalchemy import BigInteger, Integer, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class VoiceLog(Base):
    __tablename__ = "voice_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    message_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True
    )
    type: Mapped[str] = mapped_column(Enum("stt", "tts"), nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped["DateTime"] = mapped_column(DateTime, server_default=func.now())

    def __repr__(self) -> str:
        return f"<VoiceLog id={self.id} type={self.type}>"