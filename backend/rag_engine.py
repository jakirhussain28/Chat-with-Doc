import os
import re
import math
import tempfile
from typing import List, Dict, Optional
import chromadb
import shutil
import sqlite3

from langchain_community.document_loaders import (
    PyMuPDFLoader, 
    Docx2txtLoader, 
    CSVLoader, 
    TextLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever

# Import from config module
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
    """Parses, chunks, embeds, and stores the document purely in ChromaDB."""
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

        # For text files (no page/row), compute actual starting line numbers
        # by finding each chunk's position in the original source text.
        is_text_file = (
            chunks and "page" not in chunks[0].metadata and "row" not in chunks[0].metadata
        )
        if is_text_file and len(documents) == 1:
            full_text = documents[0].page_content
            search_from = 0
            for chunk in chunks:
                pos = full_text.find(chunk.page_content, search_from)
                if pos < 0:
                    pos = full_text.find(chunk.page_content)  # retry from start
                if pos >= 0:
                    chunk.metadata["line"] = full_text[:pos].count('\n') + 1
                    search_from = pos + 1

        for i, chunk in enumerate(chunks):
            chunk.metadata["source"] = filename
            if "page" in chunk.metadata:
                chunk.metadata["page"] = chunk.metadata["page"] + 1
            elif "row" in chunk.metadata:
                chunk.metadata["row"] = chunk.metadata["row"] + 1
            elif "line" not in chunk.metadata:
                # Fallback if line computation didn't cover this chunk
                chunk.metadata["line"] = i + 1

        embeddings = get_embedding_model(embed_model)
        
        # Single-Write: Store chunks, metadata, and embeddings natively in ChromaDB
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


# Module-level cache: avoids re-fetching and re-tokenizing collection data on
# every query. Validated by document count — auto-invalidates on new uploads.
_collection_cache: Dict[str, dict] = {}


def _doc_hash(doc: Document) -> str:
    """Deterministic identity key for a chunk (used for dedup + term-set lookup)."""
    return (
        f"{doc.page_content}_"
        f"{doc.metadata.get('source', '')}_"
        f"{doc.metadata.get('page', '')}_"
        f"{doc.metadata.get('row', '')}_"
        f"{doc.metadata.get('line', '')}"
    )


def _tokenize(text: str) -> frozenset:
    """Fast lowercase word tokenization (returns immutable set for caching)."""
    return frozenset(re.findall(r'\w+', text.lower()))


def _get_collection_data(collection_name: str, vectorstore) -> tuple:
    """Return (langchain_docs, doc_term_sets) — cached when possible.
    
    Cache is keyed by collection_name and validated against the live
    document count so new uploads automatically invalidate stale data.
    """
    # Fast count check (metadata only, no data transfer)
    try:
        current_count = vectorstore._collection.count()
    except Exception:
        current_count = None

    cached = _collection_cache.get(collection_name)
    if cached and current_count is not None and cached["count"] == current_count:
        return cached["docs"], cached["term_sets"]

    # Cache miss — fetch documents + metadatas (skip embeddings)
    collection_data = vectorstore.get(include=["documents", "metadatas"])

    if not collection_data or not collection_data.get("documents"):
        return [], {}

    langchain_docs = [
        Document(page_content=doc_text, metadata=meta)
        for doc_text, meta in zip(collection_data["documents"], collection_data["metadatas"])
    ]

    # Pre-tokenize every chunk once (reused for IDF + RRF boost)
    doc_term_sets: Dict[str, frozenset] = {}
    for doc in langchain_docs:
        doc_term_sets[_doc_hash(doc)] = _tokenize(doc.page_content)

    _collection_cache[collection_name] = {
        "count": current_count or len(langchain_docs),
        "docs": langchain_docs,
        "term_sets": doc_term_sets,
    }

    return langchain_docs, doc_term_sets


def compute_query_idf(
    query: str, n_docs: int, doc_term_sets: Dict[str, frozenset]
) -> Dict[str, float]:
    """Compute IDF for each query term using pre-tokenized term sets.
    
    IDF = log((N + 1) / (df + 1)) + 1   (smoothed)
    Single pass over term sets — no regex at query time.
    """
    query_terms = _tokenize(query)

    # Count document frequency in one pass
    doc_freq: Dict[str, int] = dict.fromkeys(query_terms, 0)
    for term_set in doc_term_sets.values():
        for term in query_terms:
            if term in term_set:
                doc_freq[term] += 1

    return {
        term: math.log((n_docs + 1) / (doc_freq[term] + 1)) + 1
        for term in query_terms
    }


def reciprocal_rank_fusion(
    bm25_docs: List[Document], dense_docs: List[Document],
    idf_scores: Optional[Dict[str, float]] = None,
    doc_term_sets: Optional[Dict[str, frozenset]] = None,
    k: int = 60, idf_weight: float = 0.3
) -> List[Document]:
    """RRF with IDF boosting — uses pre-computed term sets (zero redundant regex).
    
    Standard RRF is rank-position-based and blind to term rarity.
    The IDF boost adds a bonus to chunks that contain rare query terms,
    ensuring single-occurrence keywords are not lost during fusion.
    """
    doc_scores: Dict[str, float] = {}
    doc_map: Dict[str, Document] = {}

    def add_to_fusion(docs: List[Document]):
        for rank, doc in enumerate(docs):
            dh = _doc_hash(doc)
            if dh not in doc_map:
                doc_map[dh] = doc
                doc_scores[dh] = 0.0
            doc_scores[dh] += 1.0 / (k + rank + 1)

    add_to_fusion(bm25_docs)
    add_to_fusion(dense_docs)

    # Apply IDF boost using pre-tokenized sets (no re.findall calls)
    if idf_scores:
        total_idf = sum(idf_scores.values())
        if total_idf > 0:
            for dh in doc_scores:
                # Look up pre-computed term set; fall back to live tokenize if missing
                terms = (doc_term_sets or {}).get(dh) or _tokenize(doc_map[dh].page_content)
                matched = sum(idf for term, idf in idf_scores.items() if term in terms)
                doc_scores[dh] += idf_weight * (matched / total_idf)

    # Sort by combined score descending
    sorted_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)
    return [doc_map[dh] for dh, _ in sorted_docs]


async def hybrid_search(query: str, collection_name: str, embed_model: str, retrieval_k: int = 5) -> str:
    """Executes BM25 + ChromaDB dense search with IDF-boosted RRF fusion.
    
    Optimised pipeline:
      1. Collection data + term sets served from cache (validated by doc count)
      2. BM25 sparse search
      3. ChromaDB dense (embedding) search
      4. IDF computation from pre-tokenized sets (no regex at query time)
      5. RRF fusion with IDF boost
      6. Format top-K results for LLM context
    """
    embeddings = get_embedding_model(embed_model)

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR
    )

    try:
        # 1. Get documents + pre-tokenized term sets (cached)
        langchain_docs, doc_term_sets = _get_collection_data(collection_name, vectorstore)

        if not langchain_docs:
            return ""

        # Over-fetch candidates so rare keywords survive RRF fusion
        candidate_k = min(max(retrieval_k * 2, 15), len(langchain_docs))

        # 2. BM25 Sparse Search
        bm25_retriever = BM25Retriever.from_documents(langchain_docs)
        bm25_retriever.k = candidate_k
        bm25_results = bm25_retriever.invoke(query)

        # 3. ChromaDB Dense Search
        dense_results = vectorstore.similarity_search(query, k=candidate_k)

        # 4. IDF scores (uses pre-tokenized sets — no string parsing)
        idf_scores = compute_query_idf(query, len(langchain_docs), doc_term_sets)

        # 5. IDF-boosted RRF Fusion
        fused_docs = reciprocal_rank_fusion(
            bm25_results, dense_results,
            idf_scores=idf_scores,
            doc_term_sets=doc_term_sets
        )
        top_fused_docs = fused_docs[:retrieval_k]

        # 6. Format Output for the LLM Context Window
        context_parts = []
        for doc in top_fused_docs:
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", None)
            row = doc.metadata.get("row", None)

            if page is not None:
                header = f"[Source: {source}, Page: {page}]"
            elif row is not None:
                header = f"[Source: {source}, Row: {row}]"
            elif doc.metadata.get("line") is not None:
                header = f"[Source: {source}, Line: {doc.metadata['line']}]"
            else:
                header = f"[Source: {source}]"
            context_parts.append(f"{header}\n{doc.page_content}")

        return "\n\n---\n\n".join(context_parts)

    except Exception as e:
        print(f"Error during Hybrid Search: {e}")
        return ""


def delete_vector_collection(collection_name: str) -> bool:
    """Deletes a ChromaDB collection and forcefully removes orphaned physical files."""
    # Invalidate cache for this collection
    _collection_cache.pop(collection_name, None)

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