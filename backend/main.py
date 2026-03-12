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
from dotenv import load_dotenv
import uvicorn

from rag_engine import process_document, query_context

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─── MongoDB Setup ────────────────────────────────────────────────────────────

MONGO_URI = os.getenv("MONGODB_URI_LOCAL")
client = AsyncIOMotorClient(MONGO_URI)
db = client["chatdox_db"]
conversations_col = db["conversations"]

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = None
    model: Optional[str] = "llama3:instruct"
    embed_model: Optional[str] = None  # Added embed_model
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 1.0
    top_k: Optional[int] = 5
    top_p: Optional[float] = 0.8
    max_tokens: Optional[int] = 800

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    chunk_size: int = Form(512),
    chunk_overlap: int = Form(50),
    embed_model: str = Form(...)
):
    # 1. If no active conversation, create a new one to bind the file to
    if not conversation_id or conversation_id == "null":
        conv = {
            "user_id": "default_user", 
            "title": f"Doc: {file.filename[:20]}",
            "messages": [],
            "threads": [{"_id": str(ObjectId()), "title": "Main Thread"}], 
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await conversations_col.insert_one(conv)
        conversation_id = str(res.inserted_id)

    collection_name = f"conv_{conversation_id}"
    
    # 2. Read and process the document
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
    # 1. Fetch existing conversation or create a new one
    if req.conversation_id:
        conv = await conversations_col.find_one({"_id": ObjectId(req.conversation_id)})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = {
            "user_id": req.user_id,
            "title": req.message[:30] + "..." if len(req.message) > 30 else req.message,
            "messages": [],
            "threads": [{"_id": str(ObjectId()), "title": "Main Thread"}], 
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = await conversations_col.insert_one(conv)
        conv["_id"] = res.inserted_id

    conv_id_str = str(conv["_id"])

    # 2. Save the user's message to MongoDB
    user_msg = {"role": "user", "content": req.message}
    await conversations_col.update_one(
        {"_id": ObjectId(conv_id_str)},
        {
            "$push": {"messages": user_msg}, 
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    # Prepare message history for Ollama context
    messages_history = conv.get("messages", []) + [user_msg]

    # 3. Retrieve Context from ChromaDB if an embedding model is provided
    if req.embed_model:
        collection_name = f"conv_{conv_id_str}"
        context = await query_context(req.message, collection_name, req.embed_model, top_k=req.top_k)
        
        if context:
            # Inject context right before the user's latest query
            rag_instruction = f"Context information is below.\n---------------------\n{context}\n---------------------\nGiven the context information, answer the user's question."
            messages_history.insert(-1, {"role": "system", "content": rag_instruction})

    # Inject the system prompt at the very beginning
    if req.system_prompt and req.system_prompt.strip():
        messages_history.insert(0, {"role": "system", "content": req.system_prompt.strip()})

    # 4. Stream from Local Ollama
    async def event_generator():
        assistant_content = ""
        ollama_url = "http://localhost:11434/api/chat"
        
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

        # 5. Save the assistant's message to MongoDB
        assistant_msg = {"role": "assistant", "content": assistant_content}
        await conversations_col.update_one(
            {"_id": ObjectId(conv_id_str)},
            {
                "$push": {"messages": assistant_msg}, 
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        # 6. Yield the done flag
        yield f"data: {json.dumps({'done': True, 'conversation_id': conv_id_str})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/users/{user_id}/conversations")
async def get_conversations(user_id: str):
    cursor = conversations_col.find({"user_id": user_id}).sort("updated_at", -1)
    convs = []
    async for doc in cursor:
        convs.append({
            "_id": str(doc["_id"]),
            "title": doc.get("title", "New Chat"),
            "threads": doc.get("threads", [])
        })
    return convs

@app.get("/api/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    doc = await conversations_col.find_one({"_id": ObjectId(conv_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "_id": str(doc["_id"]),
        "messages": doc.get("messages", [])
    }

@app.delete("/api/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    res = await conversations_col.delete_one({"_id": ObjectId(conv_id)})
    # Optional: You could also delete the ChromaDB collection here using chroma_client.delete_collection(name=f"conv_{conv_id}")
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)