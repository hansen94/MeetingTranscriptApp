from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from typing import List, Optional
from app.services.database import get_supabase_client
from app.services.storage import upload_recording, process_recording
from app.models.recording import RecordingResponse, RecordingStatus
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recordings", tags=["recordings"])


@router.post("/upload", response_model=RecordingStatus)
async def upload_recording_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    pushToken: str = Form(...)
):
    """Upload a recording file to storage and queue for processing"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith(('audio/', 'video/')):
            raise HTTPException(
                status_code=400, 
                detail="File must be an audio or video file"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'm4a'
        unique_filename = f"{file_id}.{file_extension}"

        print("unique filename: " + unique_filename)
        logger.debug(f"pushToken: {str(pushToken)}")
        
        # Upload to Supabase Storage
        storage_path, file_content = await upload_recording(file, unique_filename)

        print("successfully stored. storage_path: " + storage_path)
        
        # Save metadata to database
        supabase = get_supabase_client()
        recording_data = {
            "id": file_id,
            "filename": file.filename or f"recording.{file_extension}",
            "storage_path": storage_path,
            "upload_time": datetime.utcnow().isoformat(),
            "status": "uploaded",
            "file_size": file.size or 0
        }

        logger.debug(f"recording_data: {str(recording_data)}")
        
        result = supabase.table("recordings").insert(recording_data).execute()

        print("recording_data success : ")
        
        if result.data:
            # Queue background processing with file content to avoid re-downloading
            background_tasks.add_task(process_recording, file_id, file_content, unique_filename, pushToken)
            
            return RecordingStatus(
                recording_id=file_id,
                status="processing",
                message="Recording uploaded successfully and queued for processing",
                storage_path=storage_path
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save recording metadata")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{recording_id}", response_model=RecordingResponse)
async def get_recording_status(recording_id: str):
    """Get recording status and metadata by ID"""
    try:
        supabase = get_supabase_client()
        result = supabase.table("recordings").select("*").eq("id", recording_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        return RecordingResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve recording: {str(e)}")


@router.get("/", response_model=List[RecordingResponse])
async def list_recordings(limit: int = 10, offset: int = 0):
    """List all recordings with pagination"""
    try:
        supabase = get_supabase_client()
        result = supabase.table("recordings")\
            .select("*")\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return [RecordingResponse(**recording) for recording in result.data]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve recordings: {str(e)}")


@router.delete("/{recording_id}")
async def delete_recording(recording_id: str):
    """Delete a recording and its associated file"""
    try:
        supabase = get_supabase_client()
        
        # Get recording info first
        result = supabase.table("recordings").select("*").eq("id", recording_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        recording = result.data[0]
        
        # Delete file from storage
        storage_result = supabase.storage.from_("recordings").remove([recording['storage_path'].replace('recordings/', '')])
        
        # Delete from database
        delete_result = supabase.table("recordings").delete().eq("id", recording_id).execute()
        
        return {"message": "Recording deleted successfully", "recording_id": recording_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete recording: {str(e)}")