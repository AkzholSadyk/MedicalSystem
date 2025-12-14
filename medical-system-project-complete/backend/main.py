import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from config import settings
from database import Base, engine

Base.metadata.create_all(bind=engine)
# Import routers
from routers import (
    ai_chat_router,
    appointments_router,
    auth_router,
    chat_router,
    dashboard_router,
    doctors_router,
    medical_records_router,
    medications_router,
    patients_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


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

