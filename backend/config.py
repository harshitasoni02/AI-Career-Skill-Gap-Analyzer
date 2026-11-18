"""
config.py — all our settings in ONE place
==========================================

Keeping settings separate from code means we can change behavior
(like switching the database) without touching any logic.
"""

import os

# Load backend/.env (if it exists) into environment variables.
# Secrets like API keys live in .env — NEVER in the code itself.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Signs the login "session" cookie. Must be changed for any real
# deployment — for our college project this is fine.
SECRET_KEY = "dev-secret-change-me-before-any-real-deployment"

# Total upload limit per request (recruiter uploads MANY resumes at once).
MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Database ------------------------------------------------------
# RIGHT NOW: SQLite — a single database FILE on disk. Zero installation,
# perfect for development. The file (skill_analyzer.db) appears
# automatically in the backend folder when the server first starts.
#
# WHEN YOU INSTALL MYSQL (guide at the bottom of database_schema.sql):
# replace the URI below with, for example:
#   "mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/skill_analyzer"
SQLALCHEMY_DATABASE_URI = os.environ.get(
    "DATABASE_URL",
    "sqlite:///" + os.path.join(BASE_DIR, "skill_analyzer.db"),
)
SQLALCHEMY_TRACK_MODIFICATIONS = False

# --- Semantic matching (Sentence Transformers) ----------------------
# If the library/model is missing, the app automatically falls back to
# keyword-only matching — it never crashes because of this feature.
SEMANTIC_ENABLED = True
SEMANTIC_MODEL = "all-MiniLM-L6-v2"     # small, fast, free model
SEMANTIC_THRESHOLD = 0.60               # 0–1; how similar = "possible match"

# --- spaCy job-description analyzer (Phase 10) -----------------------
# Detects POSSIBLE extra requirements in a job description (labeled
# "AI-detected" in the UI). Falls back gracefully if unavailable.
NLP_ENABLED = True

# --- ZIVA AI chatbot (Phases 6–8) ------------------------------------
# The Gemini API key goes in backend/.env as:
#     GEMINI_API_KEY=your-key-here
# If it is empty, ZIVA honestly reports "not configured" instead of
# pretending to work. The key NEVER appears in frontend code.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
# NOTE: Google retires old model names for NEW accounts surprisingly
# often (gemini-2.5-* stopped working the day we integrated!). If ZIVA
# ever says "model no longer available", change this name (see .env).
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
