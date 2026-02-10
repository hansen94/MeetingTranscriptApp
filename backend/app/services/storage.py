from supabase import create_client
from fastapi import UploadFile
from app.config import settings
from app.services.database import get_supabase_admin_client
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def upload_recording(file: UploadFile, filename: str) -> str:
    """Upload recording to Supabase Storage"""
    try:
        supabase = get_supabase_admin_client()
        
        # Reset file pointer to beginning
        await file.seek(0)
        
        # Read file content
        content = await file.read()
        
        # Upload to storage bucket
        result = supabase.storage.from_("recordings").upload(filename, content)
        
        if hasattr(result, 'error') and result.error:
            logger.error(f"Storage upload failed: {result.error}")
            raise Exception(f"Storage upload failed: {result.error}")
        
        return f"recordings/{filename}"
        
    except Exception as e:
        logger.error(f"Upload recording failed: {str(e)}")
        raise Exception(f"Upload failed: {str(e)}")


async def process_recording(recording_id: str):
    """Background task to process the recording"""
    try:
        logger.info(f"Starting processing for recording {recording_id}")
        
        supabase = get_supabase_admin_client()
        
        # Update status to processing
        supabase.table("recordings").update({
            "status": "processing"
        }).eq("id", recording_id).execute()
        
        # Simulate processing time (replace with actual transcription logic)
        await asyncio.sleep(5)
        
        # TODO: Add actual transcription processing here
        # For now, just mark as processed with a placeholder transcript
        processed_data = {
            "status": "processed",
            "processed_at": datetime.utcnow().isoformat(),
            "transcript": "Transcription processing completed. Replace with actual transcription service."
        }
        
        # Update status to processed
        result = supabase.table("recordings").update(processed_data).eq("id", recording_id).execute()
        
        if result.data:
            logger.info(f"Successfully processed recording {recording_id}")
        else:
            logger.error(f"Failed to update recording {recording_id} status")
            
    except Exception as e:
        logger.error(f"Processing failed for recording {recording_id}: {str(e)}")
        
        # Update status to failed
        try:
            supabase = get_supabase_admin_client()
            supabase.table("recordings").update({
                "status": "failed",
                "processed_at": datetime.utcnow().isoformat()
            }).eq("id", recording_id).execute()
        except Exception as update_error:
            logger.error(f"Failed to update error status: {str(update_error)}")


async def get_recording_download_url(storage_path: str, expires_in: int = 3600) -> str:
    """Generate a signed URL for downloading a recording"""
    try:
        supabase = get_supabase_admin_client()
        filename = storage_path.replace('recordings/', '')
        
        result = supabase.storage.from_("recordings").create_signed_url(filename, expires_in)
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Failed to create signed URL: {result.error}")
        
        return result['signedURL']
        
    except Exception as e:
        logger.error(f"Failed to create download URL: {str(e)}")
        raise Exception(f"Download URL creation failed: {str(e)}")