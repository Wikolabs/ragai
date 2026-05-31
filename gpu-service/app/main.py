"""RAGAI GPU embedding service — placeholder.

This is the future Cloud Run GPU embedding service. In production it would load
a sentence-transformers / BGE / E5 model on CUDA and expose /embed to convert
text into dense vectors for the RAG retrieval step.

This stub returns a deterministic mock vector so the rest of the stack can be
wired up before GPU resources are provisioned. It is NOT included in
docker-compose.yml (the VM has no GPU). Target deploy: Google Cloud Run with
attached L4 / A100 GPU.
"""
import hashlib
from typing import List

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="RAGAI GPU Embedding Service (placeholder)",
    description="Stub. Real embedding model will run here on Cloud Run GPU.",
    version="0.0.1",
)

EMBED_DIM = 384


class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)


class EmbedResponse(BaseModel):
    vector: List[float]
    dim: int
    model: str
    placeholder: bool = True


@app.get("/health")
def health():
    return {"status": "ok", "service": "ragai-gpu-service", "placeholder": True}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest) -> EmbedResponse:
    """Mock embedding: deterministic pseudo-vector derived from text hash.

    Real implementation will load a transformer on CUDA and return true embeddings.
    """
    seed = hashlib.sha256(req.text.encode("utf-8")).digest()
    # Stretch the 32-byte digest into a 384-float pseudo-vector in [-1, 1]
    vector = [((seed[i % len(seed)] - 128) / 128.0) for i in range(EMBED_DIM)]
    return EmbedResponse(
        vector=vector,
        dim=EMBED_DIM,
        model="placeholder-sha256-mock",
        placeholder=True,
    )
