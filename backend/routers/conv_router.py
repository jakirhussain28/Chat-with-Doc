from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from schemas import SettingsUpdate
from database import conversations_col
from rag_engine import delete_vector_collection

router = APIRouter(prefix="/api", tags=["Conversations"])

@router.get("/users/{user_id}/conversations")
async def get_conversations(user_id: str):
    cursor = conversations_col.find({"user_id": user_id}).sort("updated_at", -1)
    convs = []
    async for doc in cursor:
        convs.append({
            "_id": str(doc["_id"]),
            "title": doc.get("title", "New Chat")
        })
    return convs

@router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    doc = await conversations_col.find_one({"_id": ObjectId(conv_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "_id": str(doc["_id"]),
        "messages": doc.get("messages", []),
        "settings": doc.get("settings", {})
    }

@router.put("/conversations/{conv_id}/settings")
async def update_settings(conv_id: str, settings: SettingsUpdate):
    payload = {k: v for k, v in settings.model_dump().items() if v is not None}
    if not payload:
        return {"success": True}
        
    update_fields = {f"settings.{k}": v for k, v in payload.items()}
    update_fields["updated_at"] = datetime.utcnow()
    
    res = await conversations_col.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": update_fields}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True}

@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    # 1. Delete from MongoDB
    res = await conversations_col.delete_one({"_id": ObjectId(conv_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # 2. Delete corresponding vector collection from ChromaDB
    collection_name = f"conv_{conv_id}"
    delete_vector_collection(collection_name)
    
    return {"success": True}