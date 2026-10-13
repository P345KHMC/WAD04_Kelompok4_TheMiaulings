import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine, SessionLocal
from .routers import auth, categories, menus, transactions, reports
from .seed import isi_data_awal

# Membuat tabel jika belum ada, lalu mengisi data contoh bila database kosong.
Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    isi_data_awal(db)

app = FastAPI(title="Warkop Kita API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

for router in (auth.router, categories.router, menus.router, transactions.router, reports.router):
    app.include_router(router)

folder_upload = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(folder_upload, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=folder_upload), name="uploads")
