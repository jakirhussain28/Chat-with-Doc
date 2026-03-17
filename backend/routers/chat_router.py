from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
from bson import ObjectId
import json
import httpx

from schemas import ChatRequest
from database import conversations_col
from config import load_profile_config
from rag_engine import query_context

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("")
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

    # Hardened memory slicing logic
    past_messages = conv.get("messages", [])
    if req.history_k is not None:
        if req.history_k > 0:
            # 1. Force the number to be even (e.g., 5 becomes 4) to maintain pairs
            effective_k = req.history_k - (req.history_k % 2)
            past_messages = past_messages[-effective_k:] if effective_k > 0 else []
            
            # 2. Failsafe: Ensure the sliced history strictly starts with a 'user' role
            # (In case the database had a failed generation and left an orphaned message)
            if past_messages and past_messages[0].get("role") == "assistant":
                past_messages = past_messages[1:]
        else:
            past_messages = []
            
    messages_history = past_messages + [user_msg]

    if req.embed_model:
        collection_name = f"conv_{conv_id_str}"
        context = await query_context(req.message, collection_name, req.embed_model, retrieval_k=req.retrieval_k)
        
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