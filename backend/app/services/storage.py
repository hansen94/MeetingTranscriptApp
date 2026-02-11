from supabase import create_client
from fastapi import UploadFile
from app.config import settings
from app.services.database import get_supabase_admin_client
import asyncio
from datetime import datetime
import logging
from openai import OpenAI
import os
import tempfile

logger = logging.getLogger(__name__)

# Configure OpenAI client
client = OpenAI(api_key=settings.openai_api_key)


async def upload_recording(file: UploadFile, filename: str) -> tuple[str, bytes]:
    """Upload recording to Supabase Storage and return path and content"""
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
        
        return f"recordings/{filename}", content
        
    except Exception as e:
        logger.error(f"Upload recording failed: {str(e)}")
        raise Exception(f"Upload failed: {str(e)}")


async def process_recording(recording_id: str, file_content: bytes = None, filename: str = None):
    """Background task to process the recording with OpenAI Whisper"""
    max_retries = 1
    retry_count = 0
    
    while retry_count <= max_retries:
        try:
            logger.info(f"Starting processing for recording {recording_id} (attempt {retry_count + 1}/{max_retries + 1})")
            
            supabase = get_supabase_admin_client()
            
            # Update status to processing
            supabase.table("recordings").update({
                "status": "processing"
            }).eq("id", recording_id).execute()
            
            # Get file data - use provided content or download from storage
            if file_content and filename:
                logger.info(f"Using provided file content (skipping download)")
                file_data = file_content
            else:
                # Get recording metadata
                recording_result = supabase.table("recordings").select("*").eq("id", recording_id).execute()
                if not recording_result.data:
                    raise Exception(f"Recording {recording_id} not found in database")
                
                recording = recording_result.data[0]
                storage_path = recording['storage_path']
                filename = storage_path.replace('recordings/', '')
                
                # Download file from Supabase storage
                logger.info(f"Downloading file from storage: {storage_path}")
                file_data = supabase.storage.from_("recordings").download(filename)
            
            # Create temporary file for OpenAI processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{filename.split('.')[-1]}") as temp_file:
                temp_file.write(file_data)
                temp_file_path = temp_file.name
            
            try:
                # Transcribe with OpenAI Whisper
                logger.info(f"Transcribing with OpenAI Whisper: {temp_file_path}")
                with open(temp_file_path, "rb") as audio_file:
                    transcript_response = await asyncio.to_thread(
                        client.audio.transcriptions.create,
                        model="whisper-1",
                        file=audio_file
                    )
                
                transcript_text = transcript_response.text
                
                if not transcript_text:
                    raise Exception("OpenAI returned empty transcript")
                
                logger.info(f"Transcription completed for recording {recording_id}")
                
                # Generate summary using GPT-4
                logger.info(f"Generating summary with GPT-4 for recording {recording_id}")
                summary_response = await asyncio.to_thread(
                    client.chat.completions.create,
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that summarizes meeting transcripts. Provide a concise summary of the key points discussed in no more than one paragraph."
                        },
                        {
                            "role": "user",
                            "content": f"Please summarize the following transcript:\n\n{transcript_text}"
                        }
                    ]
                )
                
                summary_text = summary_response.choices[0].message.content
                
                if not summary_text:
                    raise Exception("OpenAI returned empty summary")
                
                logger.info(f"Summary generation completed for recording {recording_id}")
                
                # Update database with transcript and summary
                processed_data = {
                    "status": "processed",
                    "processed_at": datetime.utcnow().isoformat(),
                    "transcript": transcript_text,
                    "summary": summary_text
                }
                
                result = supabase.table("recordings").update(processed_data).eq("id", recording_id).execute()
                
                if result.data:
                    logger.info(f"Successfully processed recording {recording_id}")
                    return  # Success, exit function
                else:
                    raise Exception("Failed to update recording with transcript")
                    
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    logger.debug(f"Cleaned up temporary file: {temp_file_path}")
                    
        except Exception as e:
            logger.error(f"Processing failed for recording {recording_id} (attempt {retry_count + 1}/{max_retries + 1}): {str(e)}")
            retry_count += 1
            
            if retry_count > max_retries:
                # Final failure after retries
                logger.error(f"All retries exhausted for recording {recording_id}")
                try:
                    supabase = get_supabase_admin_client()
                    supabase.table("recordings").update({
                        "status": "failed",
                        "processed_at": datetime.utcnow().isoformat()
                    }).eq("id", recording_id).execute()
                except Exception as update_error:
                    logger.error(f"Failed to update error status: {str(update_error)}")
            else:
                # Wait before retry
                logger.info(f"Retrying in 3 seconds...")
                await asyncio.sleep(3)


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