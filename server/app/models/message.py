from sqlalchemy import BigInteger, String, Text, Integer, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(
        Enum("user", "assistant", "system"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    audio_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped["DateTime"] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message id={self.id} role={self.role} conv={self.conversation_id}>"