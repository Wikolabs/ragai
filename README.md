# RagAI — Document Q&A par Retrieval-Augmented Generation

> Posez vos questions en langage naturel. Obtenez des réponses citées depuis vos propres documents.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=flat)](https://langchain.com)
[![FAISS](https://img.shields.io/badge/FAISS-1.8-0057B7?style=flat)](https://faiss.ai)
[![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=flat)](https://groq.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://postgresql.org)

---

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Architecture mono-repo](#architecture-mono-repo)
4. [Diagrammes UML](#diagrammes-uml)
5. [PRD](#prd)
6. [User Stories](#user-stories)
7. [Règles métier RAG](#règles-métier-rag)
8. [Spécification API](#spécification-api)
9. [Simulation UI](#simulation-ui)
10. [Dataset](#dataset)
11. [Déploiement](#déploiement)
12. [CI/CD](#cicd)
13. [Roadmap](#roadmap)

---

## Vue d'ensemble

RagAI est un système RAG (Retrieval-Augmented Generation) pour la question-réponse documentaire. Les documents (PDF, Word, TXT) sont découpés en chunks, vectorisés avec `sentence-transformers`, indexés dans FAISS, puis interrogés en langage naturel. Le LLM (Groq Llama-3.1-70b) génère une réponse citée depuis les passages les plus pertinents. En mode demo, la logique RAG tourne entièrement en local sans LLM externe.

**Domaine :** Knowledge Management / Entreprise  
**Dataset :** [SQuAD 1.1 — Stanford Q&A Dataset (Kaggle)](https://www.kaggle.com/datasets/stanfordu/stanford-question-answering-dataset)  
**Port VM :** 3034 | **Sous-domaine :** ragai.wikolabs.com

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | Interface chat + upload documents |
| Backend | FastAPI (Python 3.11), Uvicorn | API ingest, query, gestion workspaces |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | Vectorisation chunks — 384 dim, CPU-friendly |
| Vector Store | FAISS (IndexFlatIP + IndexIVFFlat) | Recherche par similarité cosinus |
| Reranking | cross-encoder/ms-marco-MiniLM-L-6-v2 | Reranker top-20 → top-5 |
| LLM | Groq API (llama-3.1-70b-versatile) + Ollama (llama3.2 fallback local) | Génération de la réponse |
| PDF Parsing | PyMuPDF (fitz), python-docx | Extraction texte + métadonnées |
| Base de données | PostgreSQL 16 (documents, workspaces, sessions) | Persistance métadonnées |
| Infra | Docker Compose, Nginx | VM mono-repo (port 3034) |

### backend/requirements.txt
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
langchain==0.2.0
langchain-groq==0.1.6
langchain-community==0.2.0
sentence-transformers==3.0.1
faiss-cpu==1.8.0
PyMuPDF==1.24.4
python-docx==1.1.2
asyncpg==0.29.0
sqlalchemy[asyncio]==2.0.30
pydantic==2.7.1
tiktoken==0.7.0
```

---

## Architecture mono-repo

```
ragai/
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx             # Interface chat principale
│   │   ├── documents/           # Gestion documents uploadés
│   │   └── workspaces/          # Gestion des workspaces équipe
│   └── src/components/
│       ├── ChatInterface.tsx    # Chat avec citations
│       ├── DocumentUpload.tsx   # Drag & drop upload
│       ├── SourceCard.tsx       # Citation avec extrait + page
│       ├── ChunkViewer.tsx      # Visualisation chunks + scores
│       └── WorkspaceSelector.tsx
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── documents.py     # POST /ingest, GET /documents
│   │   │   ├── query.py         # POST /query
│   │   │   └── workspaces.py    # CRUD workspaces
│   │   ├── services/
│   │   │   ├── ingestion.py     # Chunk + embed + index
│   │   │   ├── retrieval.py     # FAISS search + reranking
│   │   │   ├── generation.py    # Groq LLM + prompt assembly
│   │   │   └── parser.py        # PDF/DOCX/TXT parsing
│   │   ├── models/
│   │   │   ├── document.py
│   │   │   └── workspace.py
│   │   └── vector_stores/       # FAISS index par workspace (gitignored)
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

---

## Diagrammes UML

### Architecture RAG complète

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0369a1', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0c4a6e', 'lineColor': '#374151', 'secondaryColor': '#f0f9ff'}}}%%
flowchart TB
    subgraph INGEST["📄 Phase d'ingestion"]
        DOC["PDF / DOCX / TXT"]
        PARSE["Parser\n(PyMuPDF, python-docx)"]
        CHUNK["Chunker\n512 tokens, overlap 64"]
        EMBED["Embedder\nall-MiniLM-L6-v2"]
        FAISS_I[("FAISS Index\npar workspace")]
        PG_I[("PostgreSQL\nMétadonnées chunks")]
    end

    subgraph QUERY["🔍 Phase de requête"]
        USER["Utilisateur\n(question NL)"]
        EMBED_Q["Embed question"]
        SEARCH["FAISS Search\ntop-20"]
        RERANK["Cross-Encoder\nReranker → top-5"]
        PROMPT["Prompt Assembly\nContexte + historique"]
        LLM["Groq\nllama-3.1-70b"]
        RESP["Réponse citée\n+ sources + page"]
    end

    DOC --> PARSE --> CHUNK --> EMBED --> FAISS_I
    EMBED --> PG_I
    USER --> EMBED_Q --> SEARCH
    FAISS_I --> SEARCH --> RERANK --> PROMPT
    PG_I --> PROMPT
    PROMPT --> LLM --> RESP
```

### Séquence — Query RAG complète

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0369a1', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
sequenceDiagram
    participant U as Utilisateur
    participant API as FastAPI
    participant EMB as Embedder
    participant FAISS as FAISS Index
    participant RR as Reranker
    participant PG as PostgreSQL
    participant LLM as Groq LLM

    U->>API: POST /query {question, workspace_id, history}
    API->>EMB: embed(question) → vector[384]
    API->>FAISS: search(vector, k=20)
    FAISS-->>API: [(chunk_id, score)]×20

    API->>PG: GET chunks by ids (texte + métadonnées)
    PG-->>API: chunks[]

    API->>RR: rerank(question, chunks×20)
    Note over RR: cross-encoder score chaque paire\n(question, chunk) → top-5

    RR-->>API: top_5_chunks avec scores

    API->>API: build_prompt(top_5, history[-3], question)
    Note over API: Filtre: si max_score < 0.7\n→ "Non trouvé dans les documents"

    API->>LLM: chat_completion(prompt, model=llama-3.1-70b)
    LLM-->>API: answer + citations [doc, page, extrait]

    API-->>U: {answer, sources: [{doc, page, excerpt, score}]}
```

### Modèle de données (ER)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0369a1', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
erDiagram
    WORKSPACE {
        uuid id PK
        string name
        string description
        uuid owner_id FK
        timestamp created_at
        int chunk_count
        string faiss_index_path
    }
    DOCUMENT {
        uuid id PK
        uuid workspace_id FK
        string filename
        string file_type
        int file_size_kb
        int page_count
        int chunk_count
        timestamp uploaded_at
        string status
    }
    CHUNK {
        uuid id PK
        uuid document_id FK
        int chunk_index
        text content
        int token_count
        int page_number
        int faiss_id
        timestamp created_at
    }
    QUERY_LOG {
        uuid id PK
        uuid workspace_id FK
        uuid session_id
        text question
        text answer
        float top_score
        int chunks_retrieved
        int tokens_used
        int latency_ms
        timestamp created_at
    }

    WORKSPACE ||--o{ DOCUMENT : "contient"
    DOCUMENT ||--o{ CHUNK : "découpé en"
    WORKSPACE ||--o{ QUERY_LOG : "interrogé via"
```

### Diagramme de chunking

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#16a34a', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
flowchart LR
    DOC["Document\n10 000 tokens"]
    C1["Chunk 1\n0–512 tok"]
    C2["Chunk 2\n448–960 tok\noverlap 64"]
    C3["Chunk 3\n896–1408 tok\noverlap 64"]
    CN["Chunk N\n..."]

    DOC --> C1 --> C2 --> C3 --> CN

    style C1 fill:#dcfce7,stroke:#16a34a
    style C2 fill:#dcfce7,stroke:#16a34a
    style C3 fill:#dcfce7,stroke:#16a34a
```

---

## PRD

### Problème
Les entreprises accumulent des centaines de documents (procédures, contrats, rapports) que personne ne consulte faute de temps. La recherche full-text retrouve des documents mais ne répond pas à des questions. Les LLMs génériques hallucinent des informations non présentes dans les sources internes.

### Solution
RAG : récupère les passages pertinents depuis les documents de l'entreprise et les injecte comme contexte dans le LLM. La réponse est ancrée dans les sources réelles avec citation page + extrait. Si l'information n'est pas dans les documents, le système l'indique clairement.

### Utilisateurs cibles
| Persona | Besoin |
|---------|--------|
| Employé opérationnel | Trouver rapidement une procédure, une clause contractuelle |
| Manager | Interroger un corpus de rapports sans les lire un par un |
| Juriste | Q&A sur contrats, identifier clauses clés |

### OKRs
- Temps de recherche documentaire réduit de 70% vs recherche manuelle
- Précision des réponses > 90% (évaluée sur SQuAD benchmark)
- Latence end-to-end < 3s (embedding + retrieval + génération)
- Taux de "non trouvé dans les documents" < 5% sur corpus exhaustif

---

## User Stories

```
US-01 [Employé] En tant qu'employé,
      je veux uploader un PDF de procédure et poser des questions dessus
      afin de trouver une information précise sans lire 50 pages.

US-02 [Manager] En tant que manager,
      je veux interroger un workspace contenant 200 rapports
      afin de synthétiser les points clés sans les lire tous.

US-03 [Système] En tant que RAG pipeline,
      je veux retourner "Information non trouvée dans les documents"
      quand le score de similarité est trop bas
      afin d'éviter les hallucinations.

US-04 [Employé] En tant qu'employé,
      je veux voir le passage exact du document d'où vient la réponse
      avec le numéro de page, afin de vérifier et pointer mes collègues.

US-05 [Admin] En tant qu'administrateur,
      je veux créer des workspaces isolés par équipe
      afin que la R&D n'accède pas aux documents RH.

US-06 [Dev] En tant que développeur,
      je veux une API POST /query compatible OpenAI
      afin d'intégrer RagAI dans notre intranet sans refactoring.
```

---

## Règles métier RAG

Ces règles garantissent la qualité et la traçabilité des réponses. Elles sont **simulables dans l'UI** (mode démo avec LLM mock).

| # | Règle | Valeur | Simulable UI |
|---|-------|--------|-------------|
| R1 | Chunk size | 512 tokens | ✅ Slider config |
| R2 | Chunk overlap | 64 tokens | ✅ |
| R3 | Retrieval top-K | 20 (avant reranking) | ✅ Slider |
| R4 | Reranked top-K | 5 (après cross-encoder) | ✅ |
| R5 | Seuil de confiance | similarity < 0.7 → "Non trouvé" | ✅ Score visible |
| R6 | Historique conversation | 3 derniers tours injectés | ✅ Chat multi-tours |
| R7 | Isolation workspaces | FAISS index séparé par workspace | ✅ Selector |
| R8 | Versionnage document | Re-upload écrase les embeddings anciens | ✅ |
| R9 | Format de citation | {document, page, extrait 150 chars} | ✅ SourceCard UI |
| R10 | Max tokens contexte | 4 096 tokens (prompt = chunks + historique + question) | ✅ |
| R11 | Langue auto-detect | Réponse dans la langue de la question | ✅ |
| R12 | Rate limiting API | 100 queries/heure par workspace (plan gratuit) | ✅ Mock counter |

---

## Spécification API

**Base URL :** `http://ragai.wikolabs.com/api/v1`

### POST /documents/ingest
```json
// Multipart form: file + workspace_id
// Response (async — retourne job_id)
{
  "job_id": "job_uuid",
  "document_id": "doc_uuid",
  "status": "PROCESSING",
  "estimated_chunks": 47
}
```

### GET /documents/ingest/{job_id}
```json
{
  "status": "COMPLETED",
  "chunks_created": 47,
  "processing_ms": 3200
}
```

### POST /query
```json
// Request
{
  "question": "Quelle est la procédure de remboursement des frais de mission ?",
  "workspace_id": "ws_uuid",
  "session_id": "sess_uuid",
  "history": [
    {"role": "user", "content": "Quel est le délai de soumission ?"},
    {"role": "assistant", "content": "Les frais doivent être soumis dans les 30 jours..."}
  ]
}

// Response
{
  "answer": "La procédure de remboursement est la suivante : ...",
  "sources": [
    {
      "document": "Politique_RH_2025.pdf",
      "page": 12,
      "excerpt": "...les frais de mission doivent être soumis via le formulaire N-14...",
      "similarity_score": 0.89
    }
  ],
  "model": "llama-3.1-70b-versatile",
  "tokens_used": 1847,
  "latency_ms": 2340
}
```

### GET /workspaces/{id}/stats
```json
{
  "workspace_id": "ws_uuid",
  "document_count": 23,
  "chunk_count": 1847,
  "query_count_7d": 234,
  "avg_similarity_score": 0.81
}
```

---

## Simulation UI

Mode démo **sans Groq API** :
1. **LLM Mock** : réponses pré-calculées sur un corpus SQuAD embarqué
2. **Chunk Viewer** : visualisation des chunks récupérés avec scores de similarité
3. **Confidence Meter** : jauge du score de similarité maximal
4. **Source Cards** : cards avec extrait + page pour chaque source citée
5. **Chat multi-tours** : historique conversation avec injection contexte visible
6. **Upload demo** : traitement d'un PDF de demo (inclus dans le repo)

```typescript
// frontend/src/lib/demo-mode.ts
// En mode DEMO (NEXT_PUBLIC_DEMO=true), remplace l'appel Groq
// par des réponses pré-calculées depuis le corpus SQuAD
export const DEMO_QA = [
  {
    question: "Who is the CEO of Acme Corp ?",
    answer: "Based on document 'company_profile.pdf' page 2: the CEO is John Smith...",
    sources: [{ document: "company_profile.pdf", page: 2, score: 0.91 }]
  }
]
```

---

## Dataset

**Kaggle :** [Stanford Question Answering Dataset (SQuAD 1.1)](https://www.kaggle.com/datasets/stanfordu/stanford-question-answering-dataset)

```bash
kaggle datasets download -d stanfordu/stanford-question-answering-dataset -p backend/app/data/
```

**Usage :** 87 599 paires question-réponse sur 536 articles Wikipedia. Utilisé pour :
- Évaluer la précision du pipeline RAG (EM + F1 score)
- Alimenter la démo sans document client réel
- Benchmarker différentes configurations (chunk_size, k, reranker)

---

## Déploiement

### docker-compose.yml
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ragai
      POSTGRES_USER: rg_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes: [pg_data:/var/lib/postgresql/data]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://rg_user:${POSTGRES_PASSWORD}@postgres/ragai
      GROQ_API_KEY: ${GROQ_API_KEY}
      FAISS_INDEX_DIR: /app/vector_stores
      EMBEDDING_MODEL: all-MiniLM-L6-v2
      LLM_MODEL: llama-3.1-70b-versatile
      DEMO_MODE: "false"
    volumes:
      - faiss_data:/app/vector_stores
    depends_on: [postgres]
    expose: ["8000"]

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: /api
      NEXT_PUBLIC_DEMO: "false"
    expose: ["3000"]
    depends_on: [backend]

  nginx:
    image: nginx:alpine
    ports: ["3034:80"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]

volumes:
  pg_data:
  faiss_data:
```

---

## CI/CD

```yaml
name: Deploy RagAI
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          script: |
            cd /opt/ragai && git pull origin main
            docker compose up -d --build
            docker compose exec backend alembic upgrade head
```

---

## Roadmap

### Phase 1 — MVP (Semaines 1–4)
- [ ] Pipeline ingest : PDF → chunks → FAISS
- [ ] FastAPI query endpoint avec retrieval + Groq
- [ ] Chat interface Next.js avec citations
- [ ] Mode démo sans LLM (réponses SQuAD pré-calculées)

### Phase 2 — Qualité (Semaines 5–8)
- [ ] Cross-encoder reranker intégré
- [ ] Seuil de confiance + message "non trouvé"
- [ ] Gestion multi-workspaces isolés
- [ ] Support DOCX, TXT, Markdown
- [ ] Historique conversation persisté

### Phase 3 — Avancé (Semaines 9–12)
- [ ] Hybrid search : dense + BM25 sparse
- [ ] HyDE (Hypothetical Document Embedding) pour améliorer le retrieval
- [ ] Évaluation automatique avec RAGAS (faithfulness, answer relevancy)
- [ ] Fallback Ollama (llama3.2) quand Groq indisponible
- [ ] Export conversation + sources en PDF

---

*Un produit [Wikolabs](https://wikolabs.com) — Intelligence artificielle appliquée aux métiers*
