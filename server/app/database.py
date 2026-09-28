from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings
import os


# Build SSL connect args
connect_args = {}
if "aivencloud" in settings.DATABASE_URL:
    ca_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ca.pem")
    if os.path.exists(ca_path):
        # Local: use CA certificate
        connect_args["ssl"] = {"ca": ca_path}
    else:
        # Render: Aiven still encrypts traffic; we just skip CA verification
        connect_args["ssl"] = {"check_hostname": False}


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()