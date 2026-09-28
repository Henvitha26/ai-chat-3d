import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.deps import get_current_user
from app.config import settings


router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXT = {".pdf", ".txt", ".md", ".csv", ".json", ".py", ".js", ".ts", ".tsx", ".java", ".cpp", ".c", ".html", ".css"}
MAX_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File type {ext} not allowed. Allowed: {', '.join(sorted(ALLOWED_EXT))}",
        )

    # Read and check size
    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File too large. Max {settings.MAX_UPLOAD_MB} MB.",
        )

    # Save to disk
    fname = f"{uuid.uuid4().hex}{ext}"
    fpath = UPLOAD_DIR / fname
    fpath.write_bytes(contents)

    # Extract text (if possible)
    extracted = ""
    try:
        if ext == ".pdf":
            from pypdf import PdfReader
            reader = PdfReader(str(fpath))
            extracted = "\n".join((p.extract_text() or "") for p in reader.pages[:30])
        elif ext in {".txt", ".md", ".csv", ".json", ".py", ".js", ".ts", ".tsx", ".java", ".cpp", ".c", ".html", ".css"}:
            extracted = contents.decode("utf-8", errors="ignore")
    except Exception as e:
        print("Extract error:", e)

    # Truncate to avoid blowing up the prompt
    extracted = extracted[:8000]

    return {
        "filename": fname,
        "original_name": file.filename,
        "url": f"/uploads/{fname}",
        "size": len(contents),
        "extracted_text": extracted,
        "has_text": bool(extracted.strip()),
    }