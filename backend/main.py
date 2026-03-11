import os
import json
import httpx
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import uvicorn

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

# Uses the exact URI provided in your .env file
MONGO_URI = os.getenv("MONGODB_URI_LOCAL")
client = AsyncIOMotorClient(MONGO_URI)
db = client["chatdox_db"]
conversations_col = db["conversations"]

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = None
    model: Optional[str] = "llama3:instruct"  # Default model if none provided
    system_prompt: Optional[str] = None       # NEW: Added system_prompt field

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    # 1. Fetch existing conversation or create a new one
    if req.conversation_id:
        conv = await conversations_col.find_one({"_id": ObjectId(req.conversation_id)})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create a new conversation with a dummy thread for the Sidebar UI
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

    # NEW: Inject the system prompt at the beginning of the context dynamically
    if req.system_prompt and req.system_prompt.strip():
        messages_history.insert(0, {"role": "system", "content": req.system_prompt.strip()})

    # 3. Stream from Local Ollama
    async def event_generator():
        assistant_content = ""
        ollama_url = "http://localhost:11434/api/chat"
        
        # Inject the model requested by the frontend
        payload = {
            "model": req.model, 
            "messages": messages_history,
            "stream": True
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
                            # Yield chunk exactly as Chat.jsx expects: 'data: {"token": "..."}'
                            yield f"data: {json.dumps({'token': token})}\n\n"
                    except Exception as e:
                        print(f"Error parsing line: {e}")

        # 4. Once streaming completes, save the assistant's message to MongoDB
        assistant_msg = {"role": "assistant", "content": assistant_content}
        await conversations_col.update_one(
            {"_id": ObjectId(conv_id_str)},
            {
                "$push": {"messages": assistant_msg}, 
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        # 5. Yield the done flag and conversation ID to update React state
        yield f"data: {json.dumps({'done': True, 'conversation_id': conv_id_str})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ─── Sidebar API Endpoints ────────────────────────────────────────────────────

@app.get("/api/users/{user_id}/conversations")
async def get_conversations(user_id: str):
    """Fetches all conversations for the Sidebar."""
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
    """Fetches a specific conversation's message history."""
    doc = await conversations_col.find_one({"_id": ObjectId(conv_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "_id": str(doc["_id"]),
        "messages": doc.get("messages", [])
    }


@app.delete("/api/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    """Deletes a conversation from MongoDB."""
    res = await conversations_col.delete_one({"_id": ObjectId(conv_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)