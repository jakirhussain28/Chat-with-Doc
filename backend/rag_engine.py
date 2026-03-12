import os
import tempfile
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

# Configure the persist directory for ChromaDB
CHROMA_PERSIST_DIR = "./chroma_data"

def get_embedding_model(model_name: str) -> OllamaEmbeddings:
    """Initializes the Langchain Ollama Embedding model."""
    return OllamaEmbeddings(
        model=model_name, 
        base_url="http://localhost:11434"
    )

async def process_document(
    file_content: bytes, filename: str, collection_name: str, 
    chunk_size: int, chunk_overlap: int, embed_model: str
) -> int:
    """Parses, chunks, embeds, and stores the document using Langchain."""
    ext = filename.lower().split('.')[-1]
    
    # 1. Write uploaded bytes to a temporary file for Langchain Loaders
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as temp_file:
        temp_file.write(file_content)
        temp_filepath = temp_file.name

    try:
        # 2. Select the appropriate Langchain Document Loader
        if ext == "pdf":
            loader = PyMuPDFLoader(temp_filepath)
        elif ext in ["doc", "docx"]:
            loader = Docx2txtLoader(temp_filepath)
        elif ext == "csv":
            loader = CSVLoader(temp_filepath)
        else:
            loader = TextLoader(temp_filepath, encoding="utf-8")
            
        # Load the document(s)
        documents = loader.load()
        
        # 3. Use Langchain's Recursive Text Splitter for smarter chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            # Recursive character splitting tries to split on paragraphs, then sentences, then words
            separators=["\n\n", "\n", " ", ""] 
        )
        
        chunks = text_splitter.split_documents(documents)
        
        if not chunks:
            return 0

        # Inject original filename into metadata
        for chunk in chunks:
            chunk.metadata["source"] = filename

        # 4. Initialize embedding model and ingest into Chroma via Langchain
        embeddings = get_embedding_model(embed_model)
        
        # This automatically handles the embedding and storing process
        Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name=collection_name,
            persist_directory=CHROMA_PERSIST_DIR
        )
        
        return len(chunks)
        
    finally:
        # 5. Clean up the temporary file so we don't leak storage
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

async def query_context(query: str, collection_name: str, embed_model: str, top_k: int = 3) -> str:
    """Retrieves relevant context from ChromaDB using Langchain."""
    embeddings = get_embedding_model(embed_model)
    
    # Connect to the existing Chroma collection
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR
    )
    
    try:
        # Perform similarity search
        docs = vectorstore.similarity_search(query, k=top_k)
        
        if not docs:
            return ""
        
        # Join the retrieved Langchain Document contents
        return "\n\n---\n\n".join([doc.page_content for doc in docs])
        
    except Exception as e:
        print(f"Error querying Chroma via Langchain: {e}")
        return ""