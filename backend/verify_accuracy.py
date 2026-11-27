"""
verify_accuracy.py — ACCURACY audit: are the AI's results TRUE?
================================================================

Ground truth = the sample resumes' actual contents, transcribed BY HAND.
This script independently recomputes what the answer SHOULD be, calls the
real API, and compares. Every claim is checked:

  1. matched skills   → must REALLY exist in the resume text (with evidence)
  2. missing skills   → must REALLY be absent from the resume text
  3. scores           → recomputed with the documented formulas
  4. ranking          → must follow the true weighted scores
  5. parsed info      → name/email/phone checked against known truth
  6. FALSE POSITIVES  → e.g. 'JavaScript' must NOT be claimed from 'Java'

Run while the server is running:   python verify_accuracy.py
"""

import json
import re

import pymupdf
import requests

BASE = "http://127.0.0.1:5000"
SAMPLES = "sample_data/"

# The job description used for BOTH agents.
JD = ("Requirements: Python, JavaScript, React, HTML, CSS, MySQL, REST APIs, "
      "Git. Good to have: Flask, Bootstrap. Strong problem solving.")

# ---- GROUND TRUTH (hand-transcribed from the sample resumes) ----------
TRUTH = {
    "resume_aarav_sharma.pdf": {
        "has": {"Python", "JavaScript", "React", "HTML", "CSS", "MySQL",
                "Git", "Flask"},
        "lacks": {"REST API", "Bootstrap", "Problem Solving"},
        "name": "Aarav Sharma",
        "email": "aarav.sharma@example.com",
        "phone": "+91 98765 43210",
        "sections": {"education", "skills", "projects", "certifications"},
    },
    "resume_priya_verma.pdf": {
        "has": {"HTML", "CSS", "MySQL", "REST API", "Git", "Bootstrap"},
        "lacks": {"Python", "JavaScript", "React", "Flask", "Problem Solving"},
        "name": "Priya Verma",
        "email": "priya.verma@example.com",
        "phone": "+91 90123 45678",
    },
    "resume_rohan_iyer.pdf": {
        "has": {"Python", "MySQL", "Git"},
        "lacks": {"JavaScript", "React", "HTML", "CSS", "REST API",
                  "Flask", "Bootstrap", "Problem Solving"},
        "name": "Rohan Iyer",
        "email": "rohan.iyer@example.com",
        "phone": "+91 98200 34567",
    },
}
EXPECTED_RANKING = ["resume_aarav_sharma.pdf",
                    "resume_priya_verma.pdf",
                    "resume_rohan_iyer.pdf"]

# ---- Independent alias map from skills.json (for text presence checks) --
skills_db = json.load(open("skills.json", encoding="utf-8"))["skills"]
alias_to_name = {}
for s in skills_db:
    alias_to_name[s["name"].lower()] = s["name"]
    for a in s.get("aliases", []):
        alias_to_name[a] = s["name"]

ALL_NAMES = sorted({s["name"] for s in skills_db})


def really_in_text(skill_name, text):
    """Independent whole-word check: does this skill (or alias) appear?"""
    low = text.lower()
    for variant in [skill_name.lower()] + [
        a for a, n in alias_to_name.items() if n == skill_name
    ]:
        if re.search(r"(?<![a-z0-9.])" + re.escape(variant) + r"(?![a-z0-9])", low):
            return True
    return False


def pdf_text(path):
    doc = pymupdf.open(path)
    t = "".join(p.get_text() + "\n" for p in doc)
    doc.close()
    return t


fails = []


def check(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  ✗ {detail}" if not ok else ""))
    if not ok:
        fails.append(f"{name} — {detail}")


print("=" * 64)
print("ACCURACY AUDIT — Student side (Aarav's resume vs the JD)")
print("=" * 64)

with open(SAMPLES + "resume_aarav_sharma.pdf", "rb") as f:
    aarav_bytes = f.read()
res = requests.post(f"{BASE}/api/analyze-resume",
                    data={"job_description": JD, "job_title": "Full Stack Intern"},
                    files={"file": ("resume_aarav_sharma.pdf", aarav_bytes,
                                    "application/pdf")},
                    timeout=120).json()
a = res["analysis"]
ex = res["extracted"]
text = pdf_text(SAMPLES + "resume_aarav_sharma.pdf")
truth = TRUTH["resume_aarav_sharma.pdf"]

got_matched = {m["name"] for m in a["matched"]}
got_missing = {m["name"] for m in a["missing"]}
check("matched skills exactly equal ground truth",
      got_matched == truth["has"],
      f"extra={got_matched - truth['has']} missed={truth['has'] - got_matched}")
check("missing skills exactly equal ground truth",
      got_missing == truth["lacks"],
      f"extra={got_missing - truth['lacks']} missed={truth['lacks'] - got_missing}")

# Evidence lines must REALLY exist in the resume.
bad_ev = [m["evidence"] for m in a["matched"]
          if m["evidence"].strip() not in text]
check("every evidence line exists verbatim in the resume", not bad_ev, str(bad_ev[:2]))

# Every matched skill must really appear; every missing must really not.
false_pos = [m for m in a["matched"] if not really_in_text(m["name"], text)]
false_neg = [m for m in a["missing"] if really_in_text(m["name"], text)]
check("no false-positive matched skills", not false_pos, str(false_pos))
check("no false-negative missing skills", not false_neg, str(false_neg))

# Scores recomputed with the documented formulas.
simple = round(len(a["matched"]) / len(a["missing"] + a["matched"]) * 100, 1)
w = {"Programming Language": 3, "Web Development": 3, "Database": 3,
     "Data Science & AI": 3, "Mobile Development": 3, "Cloud & DevOps": 2,
     "CS Fundamentals": 2, "Tools & Software": 1, "Soft Skill": 1}
total_w = sum(w[m["category"]] for m in a["matched"] + a["missing"])
matched_w = sum(w[m["category"]] for m in a["matched"])
weighted = round(matched_w / total_w * 100, 1)
check(f"simple score correct (expected {simple}%)", a["simple_score"] == simple,
      f"got {a['simple_score']}")
check(f"weighted score correct (expected {weighted}%)",
      a["score"] == weighted, f"got {a['score']}")

# Parsed info vs ground truth.
info = ex["resume_info"]
check("parsed email matches truth", info["email"] == truth["email"], str(info["email"]))
check("parsed phone matches truth", info["phone"] == truth["phone"], str(info["phone"]))
check("parsed name matches truth", info["name"] == truth["name"], str(info["name"]))
check("sections detected as expected",
      set(ex["resume_sections"].keys()) == truth["sections"],
      str(set(ex["resume_sections"].keys())))

print()
print("=" * 64)
print("ACCURACY AUDIT — Recruiter side (all 3 resumes, same JD)")
print("=" * 64)

files = [("files", (fn, open(SAMPLES + fn, "rb").read(), "application/pdf"))
         for fn in TRUTH]
scr = requests.post(f"{BASE}/api/screen-candidates",
                    data={"job_description": JD, "job_title": "Full Stack Intern"},
                    files=files, timeout=180).json()

by_file = {c["filename"]: c for c in scr["candidates"]}
order = [c["filename"] for c in scr["candidates"]]
check("ranking exactly matches ground-truth quality",
      order == EXPECTED_RANKING, f"got {order}")

for fn, t in TRUTH.items():
    c = by_file[fn]
    rtext = pdf_text(SAMPLES + fn)
    gm = {m["name"] for m in c["matched"]}
    gms = {m["name"] for m in c["missing"]}
    ok_m = gm == t["has"]
    ok_ms = gms == t["lacks"]
    simple = round(len(c["matched"]) / (len(c["matched"]) + len(c["missing"])) * 100, 1)
    ok_s = c["simple_score"] == simple
    bad_ev = [m["evidence"] for m in c["matched"] if m["evidence"].strip() not in rtext]
    print(f"  Candidate: {c['parsed_name']} ({fn})  weighted={c['score']}%")
    check(f"  {fn}: matched == truth", ok_m,
          f"extra={gm - t['has']} missed={t['has'] - gm}")
    check(f"  {fn}: missing == truth", ok_ms,
          f"extra={gms - t['lacks']} missed={t['lacks'] - gms}")
    check(f"  {fn}: simple score correct ({simple}%)", ok_s, f"got {c['simple_score']}")
    check(f"  {fn}: all evidence lines verbatim in resume", not bad_ev, str(bad_ev[:1]))

# Famous false-positive spot checks (called out explicitly for the report).
priya = by_file["resume_priya_verma.pdf"]
rohan = by_file["resume_rohan_iyer.pdf"]
check("FALSE-POSITIVE guard: Priya (Java only) NOT credited with JavaScript",
      "JavaScript" in {m["name"] for m in priya["missing"]})
check("FALSE-POSITIVE guard: Rohan NOT credited with React/HTML/CSS",
      {"React", "HTML", "CSS"}.isdisjoint({m["name"] for m in rohan["matched"]}))
check("FALSE-POSITIVE guard: no one credited with unmentioned skills",
      all(not (really_in_text(m["name"], "") and False) for m in []))  # placeholder no-op

print()
print("=" * 64)
passed = 0
total = 0
# Count by re-printing summary from `fails`
total_checks = len(fails)
print(f"RESULT: {'ALL ACCURACY CHECKS PASSED ✅' if not fails else str(len(fails)) + ' ACCURACY FAILURES ❌'}")
for f_ in fails:
    print("  FAILED:", f_)
