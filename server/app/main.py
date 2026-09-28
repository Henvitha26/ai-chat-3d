from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.routes import auth, conversations, messages, analytics, uploads


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="AI Chat 3D API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(analytics.router)
app.include_router(uploads.router)


@app.get("/", tags=["root"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "docs": "/docs"}


@app.get("/health", tags=["root"])
def health():
    return {"status": "healthy"}