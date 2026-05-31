# RAGAI GPU embedding service

GPU embedding service — deploy on Google Cloud Run with GPU later. Not in docker-compose.yml (VM has no GPU).

This is a placeholder FastAPI stub. The real implementation will load a sentence-transformers / BGE / E5 model on CUDA and expose `/embed` to convert text into dense vectors used by the RAG retrieval step in the backend.

## Endpoints

- `GET /health` — liveness
- `POST /embed` — body `{ "text": "..." }` returns `{ vector, dim, model, placeholder }`

## Local build (optional)

```bash
docker build -t ragai-gpu:latest ./gpu-service
docker run --rm -p 8001:8001 ragai-gpu:latest
```

On a host without an NVIDIA runtime the container will run on CPU and serve the mock vector.
