from typing import AsyncIterator
import httpx
import json
from app.config import settings


BASE_PROMPT = (
    "You are a helpful, friendly AI assistant inside a chat application. "
    "Give clear, accurate, and thoughtful answers. "
    "If the user asks for personal advice or guidance, respond empathetically "
    "and practically. Keep responses concise but complete. "
    "Use markdown formatting (lists, code blocks) when helpful."
)

LANGUAGE_INSTRUCTIONS = {
    "en": "Respond in English.",
    "hi": "Respond in Hindi (हिन्दी).",
    "ta": "Respond in Tamil (தமிழ்).",
    "te": "Respond in Telugu (తెలుగు).",
    "es": "Respond in Spanish (Español).",
    "fr": "Respond in French (Français).",
    "de": "Respond in German (Deutsch).",
    "zh": "Respond in Chinese (中文).",
    "ja": "Respond in Japanese (日本語).",
    "ar": "Respond in Arabic (العربية).",
}

AUTO_INSTRUCTION = (
    "Detect the language of the user's latest message and respond in that SAME language. "
    "If the message is in English, respond in English. If in Hindi, respond in Hindi. "
    "Match the user's language exactly."
)


def _build_system_prompt(language: str | None) -> str:
    if not language or language == "auto":
        return f"{BASE_PROMPT} {AUTO_INSTRUCTION}"
    instruction = LANGUAGE_INSTRUCTIONS.get(language)
    if instruction:
        return f"{BASE_PROMPT} {instruction}"
    return BASE_PROMPT


def _prepare_messages(messages: list[dict], language: str | None) -> list[dict]:
    system_prompt = _build_system_prompt(language)
    if messages and messages[0].get("role") == "system":
        return [{"role": "system", "content": system_prompt}] + messages[1:]
    return [{"role": "system", "content": system_prompt}] + messages


# ===============================================================
# OLLAMA
# ===============================================================
async def _stream_ollama(messages: list[dict]) -> AsyncIterator[str]:
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "stream": True,
        "options": {"temperature": 0.7, "num_predict": 512},
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream(
            "POST", f"{settings.OLLAMA_URL}/api/chat", json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                chunk = data.get("message", {}).get("content", "")
                if chunk:
                    yield chunk
                if data.get("done"):
                    break


async def _chat_once_ollama(messages: list[dict]) -> str:
    payload = {"model": settings.OLLAMA_MODEL, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(f"{settings.OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()
        return r.json()["message"]["content"]


# ===============================================================
# GROQ (OpenAI-compatible)
# ===============================================================
async def _stream_groq(messages: list[dict]) -> AsyncIterator[str]:
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 1024,
    }

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                except json.JSONDecodeError:
                    continue
                choices = data.get("choices", [])
                if not choices:
                    continue
                delta = choices[0].get("delta", {})
                chunk = delta.get("content", "")
                if chunk:
                    yield chunk


async def _chat_once_groq(messages: list[dict]) -> str:
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


# ===============================================================
# PUBLIC API
# ===============================================================
async def stream_chat(
    messages: list[dict],
    language: str | None = None,
) -> AsyncIterator[str]:
    prepared = _prepare_messages(messages, language)

    if settings.use_groq:
        async for token in _stream_groq(prepared):
            yield token
    else:
        try:
            async for token in _stream_ollama(prepared):
                yield token
        except (httpx.ConnectError, httpx.ReadTimeout):
            if settings.GROQ_API_KEY:
                async for token in _stream_groq(prepared):
                    yield token
            else:
                raise


async def chat_once(
    messages: list[dict],
    language: str | None = None,
) -> str:
    prepared = _prepare_messages(messages, language)

    if settings.use_groq:
        return await _chat_once_groq(prepared)
    try:
        return await _chat_once_ollama(prepared)
    except (httpx.ConnectError, httpx.ReadTimeout):
        if settings.GROQ_API_KEY:
            return await _chat_once_groq(prepared)
        raise


async def generate_title(first_message: str) -> str:
    prompt = [
        {
            "role": "system",
            "content": (
                "You create short, descriptive titles for conversations. "
                "Reply with ONLY the title — no quotes, no punctuation at the end, "
                "no extra text. 3 to 5 words maximum."
            ),
        },
        {
            "role": "user",
            "content": f"Create a title for a conversation starting with: {first_message[:500]}",
        },
    ]

    try:
        if settings.use_groq:
            raw = await _chat_once_groq(prompt)
        else:
            try:
                raw = await _chat_once_ollama(prompt)
            except (httpx.ConnectError, httpx.ReadTimeout):
                if settings.GROQ_API_KEY:
                    raw = await _chat_once_groq(prompt)
                else:
                    raise
        raw = raw.strip().strip("\"'").strip().rstrip(".!?")
        return raw[:80] or "New Chat"
    except Exception:
        return "New Chat"