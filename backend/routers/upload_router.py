from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from datetime import datetime

from database import conversations_col
from rag_engine import process_document

router = APIRouter(prefix="/api/upload", tags=["Upload"])

@router.post("")
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    chunk_size: int = Form(1024),
    chunk_overlap: int = Form(50),
    embed_model: str = Form(...)
):
    if not conversation_id or conversation_id == "null":
        conv = {
            "user_id": "default_user", 
            "title": "New Chat",
            "messages": [],
            "settings": {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await conversations_col.insert_one(conv)
        conversation_id = str(res.inserted_id)

    # Process and Embed the Document
    collection_name = f"conv_{conversation_id}"
    content = await file.read()
    num_chunks = await process_document(
        content, file.filename, collection_name, 
        chunk_size, chunk_overlap, embed_model
    )
    
    return {
        "message": "Success", 
        "chunks_processed": num_chunks, 
        "filename": file.filename,
        "conversation_id": conversation_id
    }