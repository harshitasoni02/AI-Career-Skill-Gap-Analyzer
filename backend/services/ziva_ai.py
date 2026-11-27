"""
ziva_ai.py — the AI service layer behind ZIVA, the career chatbot
==================================================================

ZIVA is powered by Google's Gemini LLM through a simple REST API:
we send a PROMPT (persona + context + the student's question) and get
generated TEXT back. That is all an LLM call is.

Design rules (from our project spec):
- The API key lives ONLY in backend/.env — never in frontend code.
- If no key is configured, we HONESTLY say so. We never fake AI replies.
- The LLM gets the logged-in student's saved analysis as CONTEXT, but
  it NEVER scores or ranks candidates — that stays with our transparent
  math in matcher.py.
- Errors (bad key, quota, network) become friendly messages.
"""

import requests

from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_API_URL


def is_configured():
    """True when a Gemini API key has been provided in backend/.env."""
    return bool(GEMINI_API_KEY.strip())


# ZIVA's personality + rules. Sent with every request so the LLM
# always stays in character and within our honesty boundaries.
SYSTEM_PERSONA = (
    "You are Ziva, a friendly personal career assistant inside a web app "
    "called 'AI-Powered Screening and Career Skill Gap Analyzer'. "
    "Your name is exactly 'Ziva' (never 'ZIVA AI' or 'Ziva AI'). "
    "Your tagline is 'Your Intelligent Career Companion'. "
    "You help students with resume improvement, understanding missing skills, "
    "decoding job descriptions, skills needed for roles, learning roadmaps, "
    "interview preparation, project ideas, and general career guidance. "
    "Rules: be encouraging and concrete; use simple beginner-friendly language; "
    "keep answers short (under ~150 words) with compact bullets when useful; "
    "never invent facts about the user that are not in the context; "
    "never guarantee jobs, internships or placements; "
    "you do NOT calculate match scores — the app's scoring engine does that."
)


def build_student_context(user, job_title, score, matched, missing):
    """
    Turn the student's LATEST SAVED ANALYSIS into a short context block
    for the prompt. Only their OWN data is used — never anyone else's.
    """
    if not job_title and not matched and not missing:
        return ""
    return (
        "\n\nCONTEXT — the currently logged-in student (use only if relevant):\n"
        f"Name: {user.name}\n"
        f"Latest saved analysis target role: {job_title or 'unknown'}\n"
        f"Weighted skill-match score: {score}%\n"
        f"Matched skills: {', '.join(matched) if matched else 'none saved'}\n"
        f"Missing skills: {', '.join(missing) if missing else 'none saved'}\n"
        "If the student asks about their results, gaps or roadmap, base your "
        "answer on THIS data. Do not invent other scores or skills."
    )


def ask_ziva(question, context, user_name):
    """
    Send one message to Gemini and return {"ok": True, "reply": str}
    or {"ok": False, "error": str}. Never raises — the chat route can
    always answer the user with something helpful.
    """
    if not is_configured():
        return {"ok": False, "error": "ZIVA AI is not configured yet."}

    prompt = (
        SYSTEM_PERSONA
        + (context or "")
        + f"\n\nThe student ({user_name}) says: {question}"
    )

    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 600},
    }

    try:
        resp = requests.post(
            GEMINI_API_URL.format(model=GEMINI_MODEL),
            params={"key": GEMINI_API_KEY},
            json=body,
            timeout=60,
        )

        if resp.status_code == 400:
            return {"ok": False,
                    "error": "Gemini rejected the request (check the API key in backend/.env)."}
        if resp.status_code == 403:
            return {"ok": False,
                    "error": "Gemini refused the key — it may be disabled or restricted."}
        if resp.status_code == 404:
            # Google retires old model names for NEW accounts regularly
            # (gemini-2.5-* stopped working the day we integrated!).
            return {"ok": False,
                    "error": ("This Gemini model is no longer available to new accounts. "
                              "Set a current model name in backend/.env (add a line like "
                              "GEMINI_MODEL=gemini-3.1-flash-lite) and restart the server.")}
        if resp.status_code == 429:
            return {"ok": False,
                    "error": "ZIVA is out of free quota for now — try again in a minute."}
        if resp.status_code == 503:
            return {"ok": False,
                    "error": "The AI model is very busy right now — try again in a moment."}
        if resp.status_code >= 500:
            return {"ok": False,
                    "error": "Google's AI service is having trouble — try again shortly."}

        data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            return {"ok": False,
                    "error": "ZIVA could not reply (safety filter or empty response). Try rephrasing."}

        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts).strip()
        if not text:
            return {"ok": False,
                    "error": "ZIVA gave an empty reply — try asking differently."}
        return {"ok": True, "reply": text}

    except requests.exceptions.Timeout:
        return {"ok": False, "error": "ZIVA took too long to answer — try again."}
    except requests.exceptions.RequestException:
        return {"ok": False,
                "error": "Could not reach the AI service — check your internet connection."}
    except Exception:
        return {"ok": False, "error": "Unexpected ZIVA error — check the server log."}
