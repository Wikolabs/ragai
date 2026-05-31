"""RAGAI demo backend — production-ready POC.

In production: this service would index documents in a vector store (pgvector / Qdrant),
embed queries via a GPU embedding model on Cloud Run, and retrieve top-k chunks
before composing the answer. For the demo: it only invokes the LLM and returns
a synthetic answer with realistic source citations.
"""
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .llm import chat, is_configured

app = FastAPI(
    title="RAGAI Demo Backend",
    description="POC backend — Groq/Gemini LLM. No vector store / no GPU.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Prompts
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT_FR = """Tu es RAGAI, un agent IA de Q&A documentaire base sur RAG (Retrieval Augmented Generation). Tu reponds en langage naturel a partir d'une base documentaire fictive, et tu cites systematiquement des sources realistes (document, page, paragraphe).

Format de sortie exact en MARKDOWN :
**📖 Reponse**
[2-4 phrases concises qui repondent directement a la question, ton neutre et factuel]

**📌 Sources citees**
- [Nom_document.pdf, p.X, §Y — extrait court d'1 ligne entre guillemets]
- [Nom_document2.pdf, p.X, §Y — extrait court d'1 ligne]
- [3-4 sources au total, inventees mais coherentes avec la collection demandee]

**🔍 Confiance**
- Score : XX% (entre 75 et 96)
- [1 phrase sur les eventuelles ambiguites ou limites de la reponse]

Tu DOIS inventer des sources realistes pour la demo (jamais "je n'ai pas access aux documents"). Tu joues le role d'un agent RAG qui a deja indexe la collection mentionnee. Reste sobre, factuel, evite le marketing. Maximum 280 mots."""

SYSTEM_PROMPT_EN = """You are RAGAI, an AI document Q&A agent built on RAG (Retrieval Augmented Generation). You answer in natural language from a fictional document corpus, and you systematically cite realistic sources (document, page, paragraph).

Exact MARKDOWN output format:
**📖 Answer**
[2-4 concise sentences that directly answer the question, neutral and factual tone]

**📌 Cited sources**
- [Document_name.pdf, p.X, §Y — short 1-line quote in quotation marks]
- [Document_name2.pdf, p.X, §Y — short 1-line quote]
- [3-4 sources total, invented but coherent with the requested collection]

**🔍 Confidence**
- Score: XX% (between 75 and 96)
- [1 sentence on any ambiguities or limits of the answer]

You MUST invent realistic sources for the demo (never "I don't have access to documents"). You play the role of a RAG agent that has already indexed the mentioned collection. Stay sober, factual, avoid marketing. Maximum 280 words."""


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=600)
    collection: str = Field(default="", max_length=120)
    lang: Literal["fr", "en"] = "fr"


class GenerateResponse(BaseModel):
    brief: str
    model: str
    generated_at: str
    static_mode: bool = False


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ragai-backend",
        "llm_configured": is_configured(),
    }


@app.post("/process", response_model=GenerateResponse)
async def process(req: GenerateRequest) -> GenerateResponse:
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="empty_question")

    collection = req.collection.strip() or (
        "documentation_interne" if req.lang == "fr" else "internal_documentation"
    )
    now_iso = datetime.now(timezone.utc).isoformat()

    user_msg = (
        f"Collection indexee : \"{collection}\". Question utilisateur : \"{question}\". "
        f"Reponds en citant des sources realistes coherentes avec cette collection."
        if req.lang == "fr"
        else f"Indexed collection: \"{collection}\". User question: \"{question}\". "
             f"Answer with realistic sources coherent with this collection."
    )

    if not is_configured():
        return GenerateResponse(
            brief=_build_mock_brief(question, collection, req.lang),
            model="static-mock",
            generated_at=now_iso,
            static_mode=True,
        )

    try:
        text, model = await chat(
            [
                {"role": "system", "content": SYSTEM_PROMPT_FR if req.lang == "fr" else SYSTEM_PROMPT_EN},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=900,
        )
    except Exception:
        return GenerateResponse(
            brief=_build_mock_brief(question, collection, req.lang),
            model="static-mock",
            generated_at=now_iso,
            static_mode=True,
        )

    return GenerateResponse(brief=text, model=model, generated_at=now_iso)


# ─────────────────────────────────────────────────────────────────────────────
# Mock answer (used when no LLM key configured)
# ─────────────────────────────────────────────────────────────────────────────
def _build_mock_brief(question: str, collection: str, lang: str) -> str:
    col = collection or ("documentation_interne" if lang == "fr" else "internal_documentation")
    if lang == "en":
        return (
            f"**📖 Answer**\n"
            f"Based on the indexed corpus \"{col}\", the answer to \"{question}\" is documented "
            f"in two primary policy documents. The relevant clause specifies a 30-day notice window "
            f"and requires explicit written approval from the line manager. Section 3.2 also notes "
            f"an exception for compliance-sensitive contexts.\n\n"
            f"**📌 Cited sources**\n"
            f"- {col}_policy_v4.pdf, p.12, §3.2 — \"Notice period shall not exceed 30 business days\"\n"
            f"- {col}_handbook_2025.pdf, p.47, §8.1 — \"Written approval required from direct line manager\"\n"
            f"- governance_charter.pdf, p.5, §1.4 — \"Compliance exceptions apply per Appendix C\"\n\n"
            f"**🔍 Confidence**\n"
            f"- Score: 89%\n"
            f"- Slight ambiguity on the compliance exception scope — see Appendix C for full conditions."
        )
    return (
        f"**📖 Reponse**\n"
        f"D'apres la collection indexee \"{col}\", la reponse a \"{question}\" est documentee dans "
        f"deux documents de politique principaux. La clause pertinente specifie un delai de 30 jours "
        f"et exige une approbation ecrite explicite du manager direct. La section 3.2 mentionne aussi "
        f"une exception pour les contextes sensibles a la conformite.\n\n"
        f"**📌 Sources citees**\n"
        f"- {col}_politique_v4.pdf, p.12, §3.2 — \"Le delai de preavis ne peut exceder 30 jours ouvres\"\n"
        f"- {col}_manuel_2025.pdf, p.47, §8.1 — \"Approbation ecrite requise du manager direct\"\n"
        f"- charte_gouvernance.pdf, p.5, §1.4 — \"Exceptions de conformite selon Annexe C\"\n\n"
        f"**🔍 Confiance**\n"
        f"- Score : 89%\n"
        f"- Legere ambiguite sur le perimetre de l'exception conformite — voir Annexe C."
    )
