"""
Create all tables in Aiven MySQL.
Run once: python db/init_aiven.py
"""
import sys
from pathlib import Path

# Make sure we can import from app/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, engine
from app.models import User, Conversation, Message, RefreshToken, VoiceLog  # noqa


def main():
    print("🔧 Connecting to Aiven MySQL...")
    print(f"   Engine URL host: {engine.url.host}")
    print(f"   Database: {engine.url.database}")

    print("\n📦 Creating tables...")
    Base.metadata.create_all(bind=engine)

    # List what now exists
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print(f"\n✅ Tables created: {len(tables)}")
    for t in sorted(tables):
        print(f"   • {t}")

    print("\n🎉 Aiven MySQL is ready!")


if __name__ == "__main__":
    main()