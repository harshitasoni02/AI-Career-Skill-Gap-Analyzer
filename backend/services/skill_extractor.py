"""
skill_extractor.py — the matching brain that finds skills inside text
=====================================================================

This file has NO Flask code on purpose. It is a pure-Python "service".
Keeping logic separate from the web server is good architecture:
we can test it, reuse it (resumes AND job descriptions), and improve
it without touching the server.

HOW IT WORKS (simple words):
1. Load our skill dictionary (skills.json) — each skill has a name,
   a category, and "aliases" (other ways people write it).
2. Take any text (resume or job description).
3. For every skill, search the text for that skill's name or aliases
   as WHOLE WORDS ONLY — so "C" does not match inside "CSS",
   and "Java" does not match inside "JavaScript".
4. For every skill found, remember the exact LINE where it appeared
   (the "evidence") — because our project rule says: show evidence,
   never just assume.
"""

import json
import os
import re

# Path to the skill dictionary. It lives one folder up from this file
# (services/ → backend/), so we build the path relative to THIS file.
SKILLS_FILE = os.path.join(os.path.dirname(__file__), "..", "skills.json")

# Load the dictionary ONCE, when this module is first imported.
# (Loading it for every request would waste time.)
with open(SKILLS_FILE, "r", encoding="utf-8") as f:
    SKILLS_DB = json.load(f)["skills"]


def _build_pattern(skill):
    """Compile one regex that can find this skill (name + all aliases)."""
    # All the ways this skill can be written, lowercased:
    variants = [skill["name"]] + skill.get("aliases", [])
    escaped = [re.escape(v.lower()) for v in variants]

    # (?<![a-z0-9.])  → the match must NOT start right after a letter,
    #                   a digit, or a dot (so "js" is not found inside
    #                   "node.js", and "c" is not found inside "abc").
    # (?![a-z0-9])    → the match must NOT end right before a letter
    #                   or digit (so "java" is not found inside
    #                   "javascript").
    # Together these make us match WHOLE WORDS only.
    body = "|".join(escaped)
    return re.compile(r"(?<![a-z0-9.])(" + body + r")(?![a-z0-9])")


# Build every search pattern once at startup (much faster than
# rebuilding them for every single resume).
PATTERNS = {skill["name"]: _build_pattern(skill) for skill in SKILLS_DB}


def extract_skills(text):
    """
    Find all dictionary skills inside `text`.

    Returns a dict:
      {
        "skills_found": [ {name, category, evidence}, ... ],
        "count": <number>
      }
    "evidence" = the exact line of text where the skill was found.
    """
    # Split the text into clean, non-empty lines.
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    lower_lines = [line.lower() for line in lines]

    found = {}  # skill name → info (a dict also removes duplicates)

    for skill in SKILLS_DB:
        pattern = PATTERNS[skill["name"]]
        for i, lower_line in enumerate(lower_lines):
            if pattern.search(lower_line):
                found[skill["name"]] = {
                    "name": skill["name"],
                    "category": skill["category"],
                    "evidence": lines[i][:120],  # keep evidence lines short
                }
                break  # one matching line is enough for this skill

    # Sort by category first, then alphabetically — nicer to read.
    skills_list = sorted(found.values(), key=lambda s: (s["category"], s["name"]))

    return {
        "skills_found": skills_list,
        "count": len(skills_list),
    }
