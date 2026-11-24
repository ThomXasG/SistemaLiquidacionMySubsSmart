import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Compatibilidad con Vercel Serverless (sistema de archivos de solo lectura excepto /tmp)
if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/paz_y_salvo.db"
    seed_db = os.path.join(BASE_DIR, "paz_y_salvo.db")
    if not os.path.exists(DB_PATH) and os.path.exists(seed_db):
        try:
            shutil.copy2(seed_db, DB_PATH)
        except Exception as e:
            print(f"Error copiando DB a /tmp en Vercel: {e}")
else:
    DB_PATH = os.path.join(BASE_DIR, "paz_y_salvo.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

