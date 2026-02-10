from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RecordingCreate(BaseModel):
    filename: str
    file_size: int


class RecordingResponse(BaseModel):
    id: str
    filename: str
    storage_path: str
    upload_time: datetime
    processed_at: Optional[datetime] = None
    status: str
    file_size: int
    transcript: Optional[str] = None
    created_at: datetime


class RecordingStatus(BaseModel):
    recording_id: str
    status: str
    message: str