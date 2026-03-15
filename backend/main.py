import os
import json
import httpx
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import uvicorn

from rag_engine import process_document, query_context

# ─── Configuration Loader ─────────────────────────────────────────────────────

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "profile_config.json")

def load_profile_config():
    """Loads the LLM configuration from the JSON file."""
    try:
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: profile_config.json not found. Using defaults.")
        return {
            "mongodb_uri_local": "mongodb://localhost:27017",
            "ollama_url_local": "http://localhost:11434",
            "generation_llms": [],
            "embedding_llms": []
        }

# Initial load for global setup
app_config = load_profile_config()

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─── MongoDB Setup ────────────────────────────────────────────────────────────

# Uses config file first, falls back to default if config key is missing
MONGO_URI = app_config.get("mongodb_uri_local", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client["chatdox_db"]
conversations_col = db["conversations"]

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = None
    model: Optional[str] = "llama3:instruct"
    embed_model: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 1.0
    top_k: Optional[int] = 5
    top_p: Optional[float] = 0.8
    max_tokens: Optional[int] = 800

class SettingsUpdate(BaseModel):
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    top_k: Optional[int] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    uploaded_file: Optional[str] = None
    gen_llm: Optional[str] = None
    embed_llm: Optional[str] = None

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/config")
async def get_config():
    """Serves the LLM configuration to the frontend dynamically."""
    return load_profile_config()

@app.put("/api/config")
async def update_config(new_config: dict):
    """Updates the LLM configuration in profile_config.json."""
    try:
        with open(CONFIG_PATH, "w") as f:
            json.dump(new_config, f, indent=2)
        
        # Update in-memory configuration 
        global app_config
        app_config = load_profile_config()
        
        return {"success": True, "message": "Configuration updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    chunk_size: int = Form(512),
    chunk_overlap: int = Form(50),
    embed_model: str = Form(...)
):
    if not conversation_id or conversation_id == "null":
        conv = {
            "user_id": "default_user", 
            "title": f"Doc: {file.filename[:20]}",
            "messages": [],
            "settings": {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await conversations_col.insert_one(conv)
        conversation_id = str(res.inserted_id)

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

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    # Fetch latest config for Ollama URL in case it changed
    current_config = load_profile_config()
    ollama_base_url = current_config.get("ollama_url_local", "http://localhost:11434")

    if req.conversation_id:
        conv = await conversations_col.find_one({"_id": ObjectId(req.conversation_id)})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = {
            "user_id": req.user_id,
            "title": req.message[:30] + "..." if len(req.message) > 30 else req.message,
            "messages": [],
            "settings": {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await conversations_col.insert_one(conv)
        conv["_id"] = res.inserted_id

    conv_id_str = str(conv["_id"])
    user_msg = {"role": "user", "content": req.message}
    await conversations_col.update_one(
        {"_id": ObjectId(conv_id_str)},
        {
            "$push": {"messages": user_msg}, 
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    messages_history = conv.get("messages", []) + [user_msg]

    if req.embed_model:
        collection_name = f"conv_{conv_id_str}"
        context = await query_context(req.message, collection_name, req.embed_model, top_k=req.top_k)
        
        if context:
            rag_instruction = f"Context information is below.\n---------------------\n{context}\n---------------------\nGiven the context information, answer the user's question."
            messages_history.insert(-1, {"role": "system", "content": rag_instruction})

    if req.system_prompt and req.system_prompt.strip():
        messages_history.insert(0, {"role": "system", "content": req.system_prompt.strip()})

    async def event_generator():
        assistant_content = ""
        ollama_url = f"{ollama_base_url}/api/chat"
        
        payload = {
            "model": req.model, 
            "messages": messages_history,
            "stream": True,
            "options": {
                "temperature": req.temperature,
                "top_k": req.top_k,
                "top_p": req.top_p,
                "num_predict": req.max_tokens 
            }
        }

        async with httpx.AsyncClient() as http_client:
            async with http_client.stream("POST", ollama_url, json=payload, timeout=None) as response:
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        if "message" in data and "content" in data["message"]:
                            token = data["message"]["content"]
                            assistant_content += token
                            yield f"data: {json.dumps({'token': token})}\n\n"
                    except Exception as e:
                        print(f"Error parsing line: {e}")

        assistant_msg = {"role": "assistant", "content": assistant_content}
        await conversations_col.update_one(
            {"_id": ObjectId(conv_id_str)},
            {
                "$push": {"messages": assistant_msg}, 
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        yield f"data: {json.dumps({'done': True, 'conversation_id': conv_id_str})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/users/{user_id}/conversations")
async def get_conversations(user_id: str):
    cursor = conversations_col.find({"user_id": user_id}).sort("updated_at", -1)
    convs = []
    async for doc in cursor:
        convs.append({
            "_id": str(doc["_id"]),
            "title": doc.get("title", "New Chat")
        })
    return convs

@app.get("/api/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    doc = await conversations_col.find_one({"_id": ObjectId(conv_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "_id": str(doc["_id"]),
        "messages": doc.get("messages", []),
        "settings": doc.get("settings", {})
    }

@app.put("/api/conversations/{conv_id}/settings")
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

@app.delete("/api/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    res = await conversations_col.delete_one({"_id": ObjectId(conv_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)