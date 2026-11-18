"""
models.py — the DATABASE tables
================================

We use SQLAlchemy, which lets us write Python classes and it converts
them into database tables automatically. Two tables:

  User     → registered accounts (students & recruiters) + profile info
  Analysis → saved results from the student and recruiter modules

SECURITY: we NEVER store real passwords. We store a one-way HASH
(scrambled fingerprint) — see app.py register/login routes.
"""

from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

# One shared SQLAlchemy object for the whole app.
db = SQLAlchemy()


def _now():
    """Current UTC time (a common professional convention)."""
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Every account is either a 'student' or a 'recruiter' (Phase 2).
    role = db.Column(db.String(20), nullable=False, default="student")

    # ---- Profile fields (Phase 4) ---------------------------------
    # Student fields and recruiter fields are kept separate: each user
    # only fills in the ones that belong to their role. The others
    # simply stay empty (None).
    college = db.Column(db.String(200), nullable=True)          # student
    degree_branch = db.Column(db.String(200), nullable=True)    # student
    graduation_year = db.Column(db.Integer, nullable=True)      # student
    profile_skills = db.Column(db.String(600), nullable=True)   # student (comma-separated)
    company = db.Column(db.String(200), nullable=True)          # recruiter
    designation = db.Column(db.String(200), nullable=True)      # recruiter
    bio = db.Column(db.String(1000), nullable=True)             # both roles
    # Optional profile picture, stored as a small base64 "data URL"
    # so we don't need extra image files on disk.
    avatar_data = db.Column(db.Text, nullable=True)             # both roles

    created_at = db.Column(db.DateTime, default=_now)

    # One user can have many saved analyses.
    analyses = db.relationship("Analysis", backref="user", lazy=True)


class Analysis(db.Model):
    __tablename__ = "analyses"

    id = db.Column(db.Integer, primary_key=True)
    # nullable=True → an analysis can exist without a logged-in user.
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    module_type = db.Column(db.String(20), nullable=False)   # 'student' | 'recruiter'
    job_title = db.Column(db.String(200), nullable=True)
    score = db.Column(db.Float, nullable=True)               # % skill match
    payload = db.Column(db.JSON, nullable=False)             # the full result, stored as JSON
    created_at = db.Column(db.DateTime, default=_now)
