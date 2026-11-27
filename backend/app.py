"""
app.py — the heart of our backend server
=========================================

ALL ROUTES:
  GET  /api/hello            → simple "are you alive?" test
  GET  /api/status           → which features are enabled (semantic, spaCy...)
  POST /api/upload-resume    → upload ONE resume PDF: extract text + skills
  POST /api/analyze-resume   → STUDENT module (student role required if logged in)
  POST /api/screen-candidates→ RECRUITER module (recruiter role required if logged in)
  POST /api/register         → create an account (student or recruiter role)
  POST /api/login            → log in (session cookie)
  POST /api/logout           → log out
  GET  /api/me               → who is logged in, including role + profile
  GET  /api/profile          → my full profile (login required)
  PUT  /api/profile          → update my profile (login required)
  POST /api/account/password → change my password (login required)
  POST /api/save-analysis    → save a result to the database (login required)
  GET  /api/my-analyses      → my saved results (login required)

ROLE RULES: logged-in users may only use the tool matching their role
(403 otherwise); guests may TRY both tools but cannot save results.
PROFILE RULES: /api/profile always works on the logged-in user only.

RESPONSE DESIGN (important for trust):
  "extracted"    → facts found IN the documents (evidence-based)
  "analysis"     → computed comparison (transparent formulas included)
  "ai_generated" → advice produced by our rules (opinions, NOT facts)
"""

import os
import time

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import pymupdf

from config import (
    SECRET_KEY,
    MAX_CONTENT_LENGTH,
    UPLOAD_FOLDER,
    SQLALCHEMY_DATABASE_URI,
    SEMANTIC_ENABLED,
    SEMANTIC_THRESHOLD,
    NLP_ENABLED,
)
from models import db, User, Analysis
from services.skill_extractor import extract_skills
from services.matcher import analyze_match
from services.resume_parser import parse_resume_info, extract_sections
from services.suggester import generate_suggestions, generate_roadmap
from services import semantic_matcher
from services import nlp_analyzer
from services import ziva_ai

# ---------------------------------------------------------------
# Server setup
# ---------------------------------------------------------------

app = Flask(__name__)
app.config.update(
    SECRET_KEY=SECRET_KEY,
    MAX_CONTENT_LENGTH=MAX_CONTENT_LENGTH,
    UPLOAD_FOLDER=UPLOAD_FOLDER,
    SQLALCHEMY_DATABASE_URI=SQLALCHEMY_DATABASE_URI,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    # Explicit SameSite=Lax: the session cookie belongs to our own site
    # and is sent along with requests coming from our own frontend.
    SESSION_COOKIE_SAMESITE="Lax",
)

# supports_credentials=True → the browser is allowed to send the login
# cookie along with requests coming from our React app.
CORS(app, supports_credentials=True)

# Connect the database and create tables if they don't exist yet.
db.init_app(app)
with app.app_context():
    db.create_all()


# Oversized uploads: Flask answers 413 with an HTML page by default.
# The frontend expects JSON, so we translate it into a friendly message.
@app.errorhandler(413)
def upload_too_large(_error):
    return jsonify({
        "success": False,
        "error": "Upload too large (max 20 MB in total). Please upload smaller PDFs."
    }), 413


# Privacy hygiene: uploaded resumes are personal data, so we do not keep
# them forever. Files older than 7 days are removed when the server starts.
def _cleanup_old_uploads(max_age_days=7):
    cutoff = time.time() - max_age_days * 24 * 60 * 60
    removed = 0
    for name in os.listdir(UPLOAD_FOLDER):
        path = os.path.join(UPLOAD_FOLDER, name)
        try:
            if os.path.isfile(path) and os.path.getmtime(path) < cutoff:
                os.remove(path)
                removed += 1
        except OSError:
            continue
    if removed:
        print(f"* Privacy cleanup: removed {removed} upload(s) older than {max_age_days} days")


_cleanup_old_uploads()

# --- Tiny migration system -----------------------------------------
# create_all() only creates NEW tables; it never changes EXISTING ones.
# This idempotent block adds columns introduced after the first release.
with app.app_context():
    user_cols = [row[1] for row in db.session.execute(text("PRAGMA table_info(users)"))]
    new_columns = {
        "role": "VARCHAR(20) NOT NULL DEFAULT 'student'",
        "college": "VARCHAR(200)",
        "degree_branch": "VARCHAR(200)",
        "graduation_year": "INTEGER",
        "profile_skills": "VARCHAR(600)",
        "company": "VARCHAR(200)",
        "designation": "VARCHAR(200)",
        "bio": "VARCHAR(1000)",
        "avatar_data": "TEXT",
    }
    for column, definition in new_columns.items():
        if column not in user_cols:
            db.session.execute(
                text(f"ALTER TABLE users ADD COLUMN {column} {definition}")
            )
    db.session.commit()


# ---------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------

def _validate_and_save_pdf(file):
    """
    Check an uploaded file is a sensible PDF and store it safely.
    Returns (original_name, stored_name, save_path).
    Raises ValueError with a friendly message if something is wrong.
    """
    if not file or file.filename == "":
        raise ValueError("No file received. Make sure a PDF is selected.")
    if not file.filename.lower().endswith(".pdf"):
        raise ValueError("Only PDF files are allowed.")
    original_name = file.filename
    safe_name = secure_filename(original_name)
    # Timestamp prefix → uploading twice never overwrites an old file.
    stored_name = f"{int(time.time())}_{safe_name}"
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], stored_name)
    file.save(save_path)
    return original_name, stored_name, save_path


def _read_pdf_text(path):
    """Open a PDF and return (text, page_count). Raises on bad files."""
    doc = pymupdf.open(path)
    page_count = len(doc)
    text_content = ""
    for page in doc:
        text_content += page.get_text() + "\n"
    doc.close()
    return text_content, page_count


def _current_user():
    """Return the logged-in User object, or None if browsing as a guest."""
    uid = session.get("user_id")
    return db.session.get(User, uid) if uid else None


def _require_role(role):
    """
    Role guard. Returns (user, None) if the request may continue,
    or (None, error_response) if a logged-in user has the WRONG role.
    Guests (no login) are allowed through — they just can't save results.
    """
    user = _current_user()
    if user and user.role != role:
        message = (
            f"This feature is for {role}s, but you are logged in as a "
            f"{user.role}. Please log in with a {role} account to use it."
        )
        return None, (jsonify({"success": False, "error": message}), 403)
    return user, None


def _clean(value, limit):
    """Trim whitespace, cap the length, and turn '' into None (empty field)."""
    value = (value or "").strip()
    return value[:limit] if value else None


def _user_dict(user):
    """The standard, safe shape of a user/profile we send to the frontend."""
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "college": user.college,
        "degree_branch": user.degree_branch,
        "graduation_year": user.graduation_year,
        "profile_skills": user.profile_skills,
        "company": user.company,
        "designation": user.designation,
        "bio": user.bio,
        "avatar": user.avatar_data,
    }


# ---------------------------------------------------------------
# Simple routes
# ---------------------------------------------------------------

@app.get("/api/hello")
def hello():
    return jsonify({
        "message": "Hello! The backend server is alive.",
        "project": "AI-Powered Screening and Career Skill Gap Analyzer",
        "version": "0.7 — weighted scoring, sections, spaCy",
    })


@app.get("/api/status")
def status():
    import importlib.util
    st_installed = importlib.util.find_spec("sentence_transformers") is not None
    spacy_installed = importlib.util.find_spec("spacy") is not None
    return jsonify({
        "success": True,
        "version": "0.7",
        "semantic_installed": st_installed,
        "semantic_enabled": SEMANTIC_ENABLED and st_installed,
        "spacy_installed": spacy_installed,
        "nlp_enabled": NLP_ENABLED and spacy_installed,
        "ziva_configured": ziva_ai.is_configured(),
    })


# ---------------------------------------------------------------
# Student + recruiter shared core: analyze one resume vs one JD
# ---------------------------------------------------------------

def _analyze_single_resume(text, jd_text, job_title):
    """The shared brain used by BOTH the student and recruiter modules."""
    resume_skills = extract_skills(text)["skills_found"]
    jd_skills = extract_skills(jd_text)["skills_found"]
    match = analyze_match(resume_skills, jd_skills)

    # Semantic "possible matches" (only if the model is available).
    possible = []
    if SEMANTIC_ENABLED:
        possible = semantic_matcher.find_possible_matches(
            match["missing"], match["extra"], SEMANTIC_THRESHOLD
        )

    # spaCy: possible EXTRA requirements in the JD that our dictionary
    # does not cover. Clearly labeled AI-detected; never changes scores.
    ai_detected_jd_terms = []
    if NLP_ENABLED:
        ai_detected_jd_terms = nlp_analyzer.analyze_job_description(
            jd_text, [s["name"] for s in jd_skills]
        )

    resume_info = parse_resume_info(text)
    resume_sections = extract_sections(text)
    suggestions = generate_suggestions(match, resume_info, text)
    roadmap = generate_roadmap(match["missing"])

    return {
        "extracted": {
            "resume_info": resume_info,
            "resume_skills": resume_skills,
            "required_skills": jd_skills,
            "resume_sections": resume_sections,
        },
        "match": match,
        "suggestions": suggestions,
        "roadmap": roadmap,
        "semantic_possible_matches": possible,
        "ai_detected_jd_terms": ai_detected_jd_terms,
        "job_title": job_title or "Untitled role",
        "jd_skills_count": len(jd_skills),
    }


# ---------------------------------------------------------------
# Route: upload ONE resume (text + skills)
# ---------------------------------------------------------------

@app.post("/api/upload-resume")
def upload_resume():
    try:
        original_name, stored_name, save_path = _validate_and_save_pdf(
            request.files.get("file")
        )
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400

    try:
        text, page_count = _read_pdf_text(save_path)
    except Exception as e:
        return jsonify({"success": False, "error": f"Could not read the PDF: {e}"}), 400

    skills_result = extract_skills(text)
    return jsonify({
        "success": True,
        "filename": original_name,
        "stored_as": stored_name,
        "pages": page_count,
        "characters": len(text),
        "skills_count": skills_result["count"],
        "skills_found": skills_result["skills_found"],
        "preview": text[:600] + ("..." if len(text) > 600 else ""),
    })


# ---------------------------------------------------------------
# Route: STUDENT MODULE — analyze my resume against a job
# ---------------------------------------------------------------

@app.post("/api/analyze-resume")
def analyze_resume():
    # Role guard: logged-in users must be students. Guests are allowed.
    _user, role_error = _require_role("student")
    if role_error:
        return role_error

    file = request.files.get("file")
    jd = (request.form.get("job_description") or "").strip()
    job_title = (request.form.get("job_title") or "").strip()

    if not jd:
        return jsonify({"success": False,
                        "error": "Please paste the job description text."}), 400
    if len(jd) > 20000:
        return jsonify({"success": False,
                        "error": "Job description too long (max 20,000 characters)."}), 400

    try:
        original_name, stored_name, save_path = _validate_and_save_pdf(file)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    try:
        text, page_count = _read_pdf_text(save_path)
    except Exception as e:
        return jsonify({"success": False, "error": f"Could not read the PDF: {e}"}), 400

    result = _analyze_single_resume(text, jd, job_title)
    result["extracted"]["pages"] = page_count
    result["extracted"]["characters"] = len(text)
    result["extracted"]["filename"] = original_name
    result["extracted"]["stored_as"] = stored_name

    match = result["match"]

    return jsonify({
        "success": True,
        "extracted": {
            **result["extracted"],
        },
        "analysis": {
            "job_title": result["job_title"],
            # Primary score: weighted (core skills matter more than tools).
            "score": match["weighted_score"],
            "score_type": "weighted",
            "score_explanation": match["weighted_score_explanation"],
            "simple_score": match["score"],
            "simple_score_explanation": match["score_explanation"],
            "matched": match["matched"],
            "missing": match["missing"],
            "extra": match["extra"],
            "category_breakdown": match["category_breakdown"],
            "weights_used": match["weights_used"],
            "semantic_possible_matches": result["semantic_possible_matches"],
            "semantic_note": ("Possible matches are AI-estimated from meaning — "
                              "NOT proof of a skill and NOT counted in the score. "
                              "Human review required.")
                             if result["semantic_possible_matches"] else None,
            "ai_detected_jd_terms": result["ai_detected_jd_terms"],
            "ai_detected_note": ("Possible extra requirements detected by spaCy AI "
                                 "in the job description — NOT from our verified "
                                 "dictionary and NOT counted in the score. Human "
                                 "review required.")
                                if result["ai_detected_jd_terms"] else None,
        },
        "ai_generated": {
            "label": ("AI-generated suggestions and roadmap — general advice "
                      "from our rules, NOT extracted from your resume."),
            "suggestions": result["suggestions"],
            "roadmap": result["roadmap"],
        },
        "disclaimer": ("This analysis supports human review. It does not "
                       "guarantee employment or selection."),
    })


# ---------------------------------------------------------------
# Route: RECRUITER MODULE — screen many resumes against a job
# ---------------------------------------------------------------

@app.post("/api/screen-candidates")
def screen_candidates():
    # Role guard: logged-in users must be recruiters. Guests are allowed.
    _user, role_error = _require_role("recruiter")
    if role_error:
        return role_error

    jd = (request.form.get("job_description") or "").strip()
    job_title = (request.form.get("job_title") or "").strip()
    if not jd:
        return jsonify({"success": False,
                        "error": "Please paste the job description text."}), 400

    files = request.files.getlist("files")
    if not files:
        return jsonify({"success": False,
                        "error": "Please upload at least one resume PDF."}), 400
    if len(files) > 20:
        return jsonify({"success": False,
                        "error": "Please upload at most 20 resumes at once."}), 400

    jd_skills = extract_skills(jd)["skills_found"]

    # spaCy: possible extra JD requirements (AI-detected, labeled).
    ai_detected_jd_terms = []
    if NLP_ENABLED:
        ai_detected_jd_terms = nlp_analyzer.analyze_job_description(
            jd, [s["name"] for s in jd_skills]
        )

    candidates, errors = [], []
    for file in files:
        try:
            original_name, stored_name, save_path = _validate_and_save_pdf(file)
            text, page_count = _read_pdf_text(save_path)
        except Exception as e:
            errors.append({"filename": getattr(file, "filename", "?"),
                           "error": str(e)})
            continue

        resume_skills = extract_skills(text)["skills_found"]
        match = analyze_match(resume_skills, jd_skills)

        possible = []
        if SEMANTIC_ENABLED:
            possible = semantic_matcher.find_possible_matches(
                match["missing"], match["extra"], SEMANTIC_THRESHOLD
            )

        info = parse_resume_info(text)
        candidates.append({
            "filename": original_name,
            "parsed_name": info["name"],
            "name_note": info["name_note"],
            "score": match["weighted_score"],
            "score_type": "weighted",
            "simple_score": match["score"],
            "matched_count": len(match["matched"]),
            "missing_count": len(match["missing"]),
            "matched": match["matched"],
            "missing": match["missing"],
            "top_extra": [s["name"] for s in match["extra"]][:8],
            "semantic_possible_matches": possible,
            "score_explanation": match["weighted_score_explanation"],
            "simple_score_explanation": match["score_explanation"],
            "pages": page_count,
        })

    # Rank by the WEIGHTED score; ties broken by simple coverage, then
    # by the number of matched skills.
    candidates.sort(key=lambda c: (-c["score"], -c["simple_score"], -c["matched_count"]))
    for rank, c in enumerate(candidates, start=1):
        c["rank"] = rank

    return jsonify({
        "success": True,
        "job": {
            "title": job_title or "Untitled role",
            "required_skills": jd_skills,
            "ai_detected_jd_terms": ai_detected_jd_terms,
        },
        "candidates": candidates,
        "errors": errors,
        "ranking_explanation": ("Candidates are ranked by WEIGHTED skill match "
                                "(core technical skills weigh 3, fundamentals/cloud 2, "
                                "tools and soft skills 1). Ties are broken by simple "
                                "coverage, then by number of matched skills."),
        "disclaimer": ("This ranking SUPPORTS human review — it is NOT an automatic "
                       "hiring or rejection decision. Skills were matched by keywords "
                       "with evidence; always verify details in the original resumes."),
    })


# ---------------------------------------------------------------
# Auth routes (register / login / logout / me)
# ---------------------------------------------------------------

@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    role = (data.get("role") or "student").strip().lower()
    if role not in ("student", "recruiter"):
        return jsonify({"success": False,
                        "error": "Role must be 'student' or 'recruiter'."}), 400

    if not name or not email:
        return jsonify({"success": False, "error": "Name and email are required."}), 400
    if "@" not in email or "." not in email:
        return jsonify({"success": False, "error": "Please enter a valid email."}), 400
    if len(password) < 8:
        return jsonify({"success": False,
                        "error": "Password must be at least 8 characters."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False,
                        "error": "An account with this email already exists."}), 409

    # generate_password_hash scrambles the password one-way — even we
    # can't read it back. THIS is why it's safe to store.
    user = User(name=name, email=email, role=role,
                password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id   # log them in right away
    return jsonify({"success": True, "user": _user_dict(user)})


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "error": "Wrong email or password."}), 401

    session["user_id"] = user.id
    return jsonify({"success": True, "user": _user_dict(user)})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"success": True})


@app.get("/api/me")
def me():
    user = _current_user()
    if not user:
        return jsonify({"success": True, "user": None})
    return jsonify({"success": True, "user": _user_dict(user)})


# ---------------------------------------------------------------
# Profile routes — ALWAYS the logged-in user only
# ---------------------------------------------------------------

@app.get("/api/profile")
def get_profile():
    user = _current_user()
    if not user:
        return jsonify({"success": False, "error": "Please log in."}), 401
    return jsonify({"success": True, "profile": _user_dict(user)})


@app.put("/api/profile")
def update_profile():
    user = _current_user()
    if not user:
        return jsonify({"success": False, "error": "Please log in."}), 401

    data = request.get_json(silent=True) or {}

    # Shared fields (both roles).
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"success": False, "error": "Name cannot be empty."}), 400
        user.name = name[:120]
    if "bio" in data:
        bio = (data.get("bio") or "").strip()
        if len(bio) > 1000:
            return jsonify({"success": False,
                            "error": "Bio is too long (max 1000 characters)."}), 400
        user.bio = bio or None
    if "avatar" in data:
        avatar = data.get("avatar")
        if avatar is None:
            user.avatar_data = None          # picture removed
        elif not isinstance(avatar, str) or not avatar.startswith("data:image/"):
            return jsonify({"success": False,
                            "error": "Profile picture must be an image file."}), 400
        elif len(avatar) > 300000:
            return jsonify({"success": False,
                            "error": "Picture too large — please choose an image "
                                     "under about 200 KB."}), 400
        else:
            user.avatar_data = avatar

    # Role-specific fields: a student cannot set company fields and a
    # recruiter cannot set college fields — we only read what matches.
    if user.role == "student":
        if "college" in data:
            user.college = _clean(data.get("college"), 200)
        if "degree_branch" in data:
            user.degree_branch = _clean(data.get("degree_branch"), 200)
        if "graduation_year" in data:
            gy = data.get("graduation_year")
            if gy in (None, ""):
                user.graduation_year = None
            else:
                try:
                    gy = int(gy)
                except (TypeError, ValueError):
                    return jsonify({"success": False,
                                    "error": "Graduation year must be a number."}), 400
                if gy < 2000 or gy > 2100:
                    return jsonify({"success": False,
                                    "error": "Enter a realistic graduation year."}), 400
                user.graduation_year = gy
        if "profile_skills" in data:
            user.profile_skills = _clean(data.get("profile_skills"), 600)
    elif user.role == "recruiter":
        if "company" in data:
            user.company = _clean(data.get("company"), 200)
        if "designation" in data:
            user.designation = _clean(data.get("designation"), 200)

    db.session.commit()
    return jsonify({"success": True, "profile": _user_dict(user)})


@app.post("/api/account/password")
def change_password():
    user = _current_user()
    if not user:
        return jsonify({"success": False, "error": "Please log in."}), 401

    data = request.get_json(silent=True) or {}
    current = data.get("current_password") or ""
    new = data.get("new_password") or ""

    # Security: you must prove the CURRENT password to set a new one.
    if not check_password_hash(user.password_hash, current):
        return jsonify({"success": False,
                        "error": "Your current password is incorrect."}), 400
    if len(new) < 8:
        return jsonify({"success": False,
                        "error": "New password must be at least 8 characters."}), 400

    user.password_hash = generate_password_hash(new)
    db.session.commit()
    return jsonify({"success": True, "message": "Password changed successfully."})


# ---------------------------------------------------------------
# ZIVA AI — personal career chatbot (Phases 6–8)
# ---------------------------------------------------------------

# Simple in-memory rate limiting: too many messages in a row would burn
# the free Gemini quota, so we cap each user at N messages per minute.
_ziva_message_times = {}   # user_id → list of recent send timestamps
ZIVA_RATE_LIMIT = 15       # messages per minute


@app.post("/api/ziva/chat")
def ziva_chat():
    user = _current_user()
    if not user:
        return jsonify({"success": False,
                        "error": "Please log in to chat with Ziva."}), 401

    # Honesty first: if no API key is configured, say so — never fake AI.
    if not ziva_ai.is_configured():
        return jsonify({
            "success": False,
            "error": ("Ziva is not configured yet. A Gemini API key must be "
                      "added to backend/.env and the server restarted.")
        }), 503

    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"success": False, "error": "Type a message first."}), 400
    if len(message) > 2000:
        return jsonify({"success": False,
                        "error": "Message too long (max 2000 characters)."}), 400

    # Rate limit (protects the free quota from hammering).
    now = time.time()
    stamps = [t for t in _ziva_message_times.get(user.id, []) if now - t < 60]
    if len(stamps) >= ZIVA_RATE_LIMIT:
        return jsonify({"success": False,
                        "error": "You're sending messages too fast — wait a moment."}), 429
    stamps.append(now)
    _ziva_message_times[user.id] = stamps

    # Context-awareness (Phase 8): pull the user's LATEST SAVED STUDENT
    # analysis from the database so ZIVA can discuss their real results.
    # Guests and recruiters simply get no personal context block.
    context = ""
    if user.role == "student":
        latest = (Analysis.query.filter_by(user_id=user.id, module_type="student")
                  .order_by(Analysis.created_at.desc()).first())
        if latest:
            payload = latest.payload or {}
            context = ziva_ai.build_student_context(
                user,
                latest.job_title,
                latest.score,
                payload.get("matched", []),
                payload.get("missing", []),
            )

    result = ziva_ai.ask_ziva(message, context, user.name)
    if not result.get("ok"):
        return jsonify({"success": False, "error": result.get("error")}), 502
    return jsonify({"success": True, "reply": result["reply"]})


# ---------------------------------------------------------------
# Saved results (history) — login required
# ---------------------------------------------------------------

@app.post("/api/save-analysis")
def save_analysis():
    user = _current_user()
    if not user:
        return jsonify({"success": False, "error": "Please log in to save results."}), 401

    data = request.get_json(silent=True) or {}
    module = data.get("module_type")
    if module not in ("student", "recruiter"):
        return jsonify({"success": False, "error": "module_type must be 'student' or 'recruiter'."}), 400

    analysis = Analysis(
        user_id=user.id,
        module_type=module,
        job_title=(data.get("job_title") or "Untitled role")[:200],
        score=data.get("score"),
        payload=data.get("payload") or {},
    )
    db.session.add(analysis)
    db.session.commit()
    return jsonify({"success": True, "id": analysis.id})


@app.get("/api/my-analyses")
def my_analyses():
    user = _current_user()
    if not user:
        return jsonify({"success": False, "error": "Please log in."}), 401

    rows = (Analysis.query.filter_by(user_id=user.id)
            .order_by(Analysis.created_at.desc()).limit(50).all())
    return jsonify({
        "success": True,
        "analyses": [{
            "id": r.id,
            "module_type": r.module_type,
            "job_title": r.job_title,
            "score": r.score,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            # Include the saved details so the History page can display
            # the FULL previous analysis, not just the summary line.
            "payload": r.payload or {},
        } for r in rows],
    })


# ---------------------------------------------------------------
# Start the server
# ---------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
