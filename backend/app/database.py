import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# Default SQLite (tanpa instalasi). Untuk PostgreSQL cukup ubah environment variable:
# DATABASE_URL=postgresql+psycopg2://user:pass@localhost/warkop
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./warkop.db")
is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if is_sqlite else {})

if is_sqlite:
    @event.listens_for(engine, "connect")
    def aktifkan_foreign_key(koneksi, _):
        koneksi.execute("PRAGMA foreign_keys=ON")  # SQLite mematikan FK secara default

SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
