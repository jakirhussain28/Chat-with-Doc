import os
import tempfile
import json
from typing import List

# Langchain Imports
from langchain_community.document_loaders import (
    PyMuPDFLoader, 
    Docx2txtLoader, 
    CSVLoader, 
    TextLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

CHROMA_PERSIST_DIR = "./chroma_data"
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "profile_config.json")

def get_ollama_url() -> str:
    """Reads the Ollama URL dynamically from the config file."""
    try:
        with open(CONFIG_PATH, "r") as f:
            config = json.load(f)
            return config.get("ollama_url_local")
    except FileNotFoundError:
        return None

def get_embedding_model(model_name: str) -> OllamaEmbeddings:
    """Initializes the Langchain Ollama Embedding model dynamically."""
    kwargs = {"model": model_name}
    url = get_ollama_url()
    if url:
        kwargs["base_url"] = url
    return OllamaEmbeddings(**kwargs)

async def process_document(
    file_content: bytes, filename: str, collection_name: str, 
    chunk_size: int, chunk_overlap: int, embed_model: str
) -> int:
    """Parses, chunks, embeds, and stores the document using Langchain."""
    ext = filename.lower().split('.')[-1]
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as temp_file:
        temp_file.write(file_content)
        temp_filepath = temp_file.name

    try:
        if ext == "pdf":
            loader = PyMuPDFLoader(temp_filepath)
        elif ext in ["doc", "docx"]:
            loader = Docx2txtLoader(temp_filepath)
        elif ext == "csv":
            loader = CSVLoader(temp_filepath)
        else:
            loader = TextLoader(temp_filepath, encoding="utf-8")
            
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""] 
        )
        
        chunks = text_splitter.split_documents(documents)
        
        if not chunks:
            return 0

        for chunk in chunks:
            chunk.metadata["source"] = filename

        embeddings = get_embedding_model(embed_model)
        
        Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name=collection_name,
            persist_directory=CHROMA_PERSIST_DIR
        )
        
        return len(chunks)
        
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

async def query_context(query: str, collection_name: str, embed_model: str, top_k: int = 3) -> str:
    """Retrieves relevant context from ChromaDB using Langchain."""
    embeddings = get_embedding_model(embed_model)
    
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR
    )
    
    try:
        docs = vectorstore.similarity_search(query, k=top_k)
        
        if not docs:
            return ""
        
        return "\n\n---\n\n".join([doc.page_content for doc in docs])
        
    except Exception as e:
        print(f"Error querying Chroma via Langchain: {e}")
        return ""