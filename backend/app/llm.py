"""LLM helper: Groq (primary) -> Gemini (fallback). Shared by all demo endpoints."""
import os
from typing import List, Dict, Tuple

import httpx

GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-2.0-flash"

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _groq_key() -> str:
    return os.getenv("GROQ_API_KEY", "")


def _gemini_key() -> str:
    return os.getenv("GEMINI_API_KEY", "")


def is_configured() -> bool:
    return bool(_groq_key() or _gemini_key())


async def _call_groq(messages: List[Dict[str, str]], max_tokens: int) -> str:
    key = _groq_key()
    if not key:
        raise RuntimeError("no_groq_key")
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.6,
                "max_tokens": max_tokens,
            },
        )
        r.raise_for_status()
        data = r.json()
        return (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()


async def _call_gemini(messages: List[Dict[str, str]], max_tokens: int) -> str:
    key = _gemini_key()
    if not key:
        raise RuntimeError("no_gemini_key")
    system = next((m["content"] for m in messages if m["role"] == "system"), "")
    user_turns = [m for m in messages if m["role"] != "system"]
    contents = [
        {
            "role": "model" if m["role"] == "assistant" else "user",
            "parts": [{"text": m["content"]}],
        }
        for m in user_turns
    ]
    url = GEMINI_URL.format(model=GEMINI_MODEL) + f"?key={key}"
    body = {
        "contents": contents,
        "generationConfig": {"temperature": 0.6, "maxOutputTokens": max_tokens},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, json=body, headers={"Content-Type": "application/json"})
        r.raise_for_status()
        data = r.json()
        return (
            (data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text") or "")
        ).strip()


async def chat(messages: List[Dict[str, str]], max_tokens: int = 900) -> Tuple[str, str]:
    """Returns (text, model_name). Raises RuntimeError if no provider available."""
    if _groq_key():
        try:
            text = await _call_groq(messages, max_tokens)
            if text:
                return text, GROQ_MODEL
        except Exception:
            pass
    if _gemini_key():
        try:
            text = await _call_gemini(messages, max_tokens)
            if text:
                return text, GEMINI_MODEL
        except Exception:
            pass
    raise RuntimeError("no_llm_available")
