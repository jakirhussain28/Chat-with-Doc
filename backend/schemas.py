from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = None
    model: Optional[str] = "llama3:instruct"
    embed_model: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 0.7
    top_k: Optional[int] = 40
    retrieval_k: Optional[int] = 5
    history_k: Optional[int] = 8
    top_p: Optional[float] = 0.8
    max_tokens: Optional[int] = 800

class SettingsUpdate(BaseModel):
    preset: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    top_k: Optional[int] = None
    retrieval_k: Optional[int] = None
    history_k: Optional[int] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    uploaded_files: Optional[list[str]] = None
    gen_llm: Optional[str] = None
    embed_llm: Optional[str] = None