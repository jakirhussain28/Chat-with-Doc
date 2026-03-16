import os
import tempfile
from typing import List
import chromadb
import shutil
import sqlite3

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

# Import from our new config module
from config import load_profile_config

CHROMA_PERSIST_DIR = "./chroma_data"

def get_ollama_url() -> str:
    """Reads the Ollama URL dynamically from the config file."""
    config = load_profile_config()
    return config.get("ollama_url_local")

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

def delete_vector_collection(collection_name: str) -> bool:
    """Deletes a ChromaDB collection and forcefully removes orphaned physical files."""
    try:
        client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        client.delete_collection(name=collection_name)
        print(f"Successfully deleted ChromaDB collection metadata: {collection_name}")
        
    except Exception as e:
        print(f"Notice: ChromaDB collection '{collection_name}' not found: {e}")
        
    try:
        db_path = os.path.join(CHROMA_PERSIST_DIR, "chroma.sqlite3")
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT id FROM segments WHERE scope = 'VECTOR'")
            active_segment_ids = {row[0] for row in cursor.fetchall()}
            conn.close()

            for item in os.listdir(CHROMA_PERSIST_DIR):
                item_path = os.path.join(CHROMA_PERSIST_DIR, item)
                
                if os.path.isdir(item_path) and len(item) == 36 and item.count('-') == 4:
                    if item not in active_segment_ids:
                        shutil.rmtree(item_path, ignore_errors=True)
                        print(f"Physically deleted orphaned Chroma segment folder: {item}")
                        
        return True
    except Exception as e:
        print(f"Error during physical Chroma file cleanup: {e}")
        return False