"""
resume_parser.py — pulls structured information out of resume text
===================================================================

Two jobs:
1. parse_resume_info()      → contact info (name, email, phone, LinkedIn)
2. extract_sections()       → split the resume into SECTIONS
                              (education, skills, projects, experience...)

These are HEURISTICS (clever guesses), not perfect understanding.
That's why the name is labeled "estimated" — our project rule says:
clearly distinguish extracted info from guesses/AI output.
"""

import re

# Regexes = text patterns. Each one describes the SHAPE of the thing we want.
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\s\-()]{8,15}\d)")
LINKEDIN_RE = re.compile(r"(linkedin\.com/[A-Za-z0-9_\-/.]+)", re.IGNORECASE)


def parse_resume_info(text):
    """Try to find name, email, phone and LinkedIn in resume text."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    email = EMAIL_RE.search(text)
    phone = PHONE_RE.search(text)
    linkedin = LINKEDIN_RE.search(text)

    # Name heuristic: check the first few lines for a short line made
    # mostly of letters (resumes usually start with the person's name).
    name = None
    for line in lines[:6]:
        if EMAIL_RE.search(line) or PHONE_RE.search(line):
            continue                                  # it's contact info, not a name
        if len(line) < 2 or len(line) > 50:
            continue                                  # too short / too long
        letter_ratio = sum(ch.isalpha() or ch.isspace() for ch in line) / len(line)
        if letter_ratio < 0.7:
            continue                                  # too many symbols/numbers
        if line.isupper() or line.istitle():
            name = line.title() if line.isupper() else line
            break
        if name is None:
            name = line                               # keep as a fallback guess
            continue

    return {
        "name": name,
        "name_note": ("Estimated from the top of the resume — please verify."
                      if name else None),
        "email": email.group(0) if email else None,
        "phone": phone.group(0).strip() if phone else None,
        "linkedin": linkedin.group(1) if linkedin else None,
    }


# ---------------------------------------------------------------------
# SECTION PARSING (Phase 9)
# ---------------------------------------------------------------------
# Known resume headings. We compare a line against these names (and
# their singular/plural forms) to decide "a new section starts here".
SECTION_HEADERS = {
    "education": [
        "education", "academic background", "academics",
        "educational qualification", "educational qualifications",
    ],
    "skills": [
        "skills", "technical skills", "skills summary", "core skills",
        "key skills", "skill set", "technologies", "technical proficiency",
    ],
    "projects": [
        "projects", "academic projects", "personal projects",
        "key projects", "projects handled", "mini projects",
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "work history", "employment history", "internships",
        "internship experience", "training experience",
    ],
    "certifications": [
        "certifications", "certificates", "licenses & certifications",
        "courses and certifications", "certification",
    ],
    "achievements": [
        "achievements", "awards", "honors", "honours", "accomplishments",
        "extracurricular activities", "extra-curricular activities",
    ],
}


def _match_header(candidate):
    """Return the section key if this line looks like a heading, else None."""
    if not candidate or len(candidate) > 40:
        return None
    # Compare both with and without a trailing "s" so "SKILL" matches
    # the "skills" heading list (and vice versa).
    stripped_pairs = {(n, n.rstrip("s")) for n in SECTION_HEADERS.keys()}
    for key, names in SECTION_HEADERS.items():
        for name in names:
            if candidate == name or candidate.rstrip("s") == name.rstrip("s"):
                return key
    return None


def extract_sections(text):
    """
    Split resume text into sections keyed by heading:
      { "education": "...", "skills": "...", "projects": "...", ... }
    Only headings that actually appear in the resume are included.
    Each section's text is capped to keep API responses small.
    """
    lines = [l.strip() for l in text.split("\n")]
    collected = {}   # section key → list of lines
    current = None   # which section we are inside right now

    for line in lines:
        # A heading is a short line that matches a known name (after
        # removing bullets, dashes and colons like "SKILLS:").
        candidate = line.lower().strip("•-–—: \t").strip()
        header = _match_header(candidate)
        if header:
            current = header
            collected.setdefault(current, [])
            continue
        if current and line:
            collected[current].append(line)

    return {k: "\n".join(v)[:1500] for k, v in collected.items() if v}
