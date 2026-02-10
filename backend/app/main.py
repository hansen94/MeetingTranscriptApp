from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import recordings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Meeting Transcript API",
    version="1.0.0",
    description="API for uploading and processing meeting recordings"
)

# Configure CORS for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recordings.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Meeting Transcript API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "service": "meeting-transcript-api",
        "version": "1.0.0"
    }