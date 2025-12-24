import logging

from config import settings
from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

Base.metadata.create_all(bind=engine)
# Import routers
from routers import (
    admin_router,
    ai_chat_router,
    appointments_router,
    auth_router,
    chat_router,
    dashboard_router,
    doctors_router,
    medical_records_router,
    medications_router,
    patients_router,
    webauthn_router,
    # face router will be imported below
)

# NOTE: runtime migration relocated below after logger is configured

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Ensure avatar_url columns exist (simple runtime migration for SQLite)
try:
    with engine.connect() as conn:
        # Check patients table for avatar_url
        res = conn.execute(text("PRAGMA table_info(patients)")).fetchall()
        cols = [r[1] for r in res]
        if "avatar_url" not in cols:
            conn.execute(text("ALTER TABLE patients ADD COLUMN avatar_url TEXT"))

        # Check doctors table for avatar_url
        res = conn.execute(text("PRAGMA table_info(doctors)")).fetchall()
        cols = [r[1] for r in res]
        if "avatar_url" not in cols:
            conn.execute(text("ALTER TABLE doctors ADD COLUMN avatar_url TEXT"))
        logger.info("Runtime migration check completed for avatar_url columns")
except Exception as e:
    logger.warning(f"Runtime migration check failed: {e}")

# Ensure WebAuthn columns exist on users table (runtime migration for SQLite)
try:
    with engine.connect() as conn:
        res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
        cols = [r[1] for r in res]
        altered = False
        if "credential_id" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN credential_id TEXT"))
            altered = True
        if "public_key" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN public_key TEXT"))
            altered = True
        if "sign_count" not in cols:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN sign_count INTEGER DEFAULT 0")
            )
            altered = True
        if "webauthn_enabled" not in cols:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN webauthn_enabled BOOLEAN DEFAULT 0")
            )
            altered = True

        if altered:
            logger.info("Runtime migration: added WebAuthn columns to users table")
except Exception as e:
    logger.warning(f"Runtime migration for WebAuthn columns failed: {e}")

# Ensure face_embedding column exists
try:
    with engine.connect() as conn:
        res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
        cols = [r[1] for r in res]
        if "face_embedding" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN face_embedding TEXT"))
            logger.info("Runtime migration: added face_embedding column to users table")
except Exception as e:
    logger.warning(f"Runtime migration for face_embedding failed: {e}")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Medical System API with AI Chat integration",
    docs_url="/docs",
    redoc_url="/redoc",
)

origins = [
    "*",
]


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Base.metadata.create_all(bind=engine)


# Include routers
app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(patients_router.router, prefix="/patients", tags=["Patients"])
app.include_router(doctors_router.router, prefix="/doctors", tags=["Doctors"])
app.include_router(
    appointments_router.router, prefix="/appointments", tags=["Appointments"]
)
app.include_router(
    medical_records_router.router, prefix="/medical-records", tags=["Medical Records"]
)
app.include_router(
    medications_router.router, prefix="/medications", tags=["Medications"]
)
app.include_router(dashboard_router.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(ai_chat_router.router, prefix="/ai-chat", tags=["AI Chat"])
app.include_router(chat_router.router, prefix="/chat", tags=["Chat"])
app.include_router(webauthn_router.router, prefix="/webauthn", tags=["WebAuthn"])
app.include_router(admin_router.router)
# Keep legacy /face router (camera-based JSON endpoints) but also expose
# PromTech-compatible faceid router under /api/faceid so frontend can
# call the same endpoint and payload as PromTech.
from faceid.router import router as faceid_router
from routers import face_router

app.include_router(face_router.router, prefix="/face", tags=["Face"])
app.include_router(faceid_router, prefix="/api/faceid", tags=["Face Verification"])

# Serve static files (avatars, attachments)
app.mount("/static", StaticFiles(directory="./static"), name="static")


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint
    """
    return {
        "message": "Welcome to Medical System API 🏥",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"OpenAI API configured: {bool(settings.OPENAI_API_KEY)}")

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
