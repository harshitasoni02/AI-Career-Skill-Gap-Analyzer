"""
audit_api_test.py — automated FULL backend test suite
======================================================

Run this while the Flask server is running:
    python audit_api_test.py

It tests EVERY backend feature: auth, roles, profiles, both agents,
history, ZIVA states, validation rules, and data isolation.
Keep it in the project — it's proof of systematic testing for your viva!
"""

import sys
import time

import requests

BASE = "http://127.0.0.1:5000"
STAMP = str(int(time.time()))          # unique emails so re-runs never collide
S_EMAIL = f"audit.student.{STAMP}@test.com"
R_EMAIL = f"audit.recruiter.{STAMP}@test.com"
PASSWORD = "auditpass123"       # recruiter's password (never changes)
S_PASSWORD = "auditpass123"     # student's password (changes in Phase B)

results = []   # (name, ok, detail)


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" — {detail}" if detail and not ok else ""))


def s():
    """Session for the audit STUDENT."""
    sess = requests.Session()
    r = sess.post(f"{BASE}/api/login",
                  json={"email": S_EMAIL, "password": S_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"student login failed: {r.status_code} {r.text[:120]}"
    return sess


def r_():
    """Session for the audit RECRUITER."""
    sess = requests.Session()
    r = sess.post(f"{BASE}/api/login",
                  json={"email": R_EMAIL, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, f"recruiter login failed: {r.status_code} {r.text[:120]}"
    return sess


print("=" * 60)
print("PHASE A — AUTHENTICATION & ROLES")
print("=" * 60)

r1 = requests.post(f"{BASE}/api/register", json={
    "name": "Audit Student", "email": S_EMAIL,
    "password": PASSWORD, "role": "student"}, timeout=30)
check("register student (200, role=student)",
      r1.status_code == 200 and r1.json()["user"]["role"] == "student")

r2 = requests.post(f"{BASE}/api/register", json={
    "name": "Audit Recruiter", "email": R_EMAIL,
    "password": PASSWORD, "role": "recruiter"}, timeout=30)
check("register recruiter (200, role=recruiter)",
      r2.status_code == 200 and r2.json()["user"]["role"] == "recruiter")

check("duplicate email rejected (409)",
      requests.post(f"{BASE}/api/register", json={
          "name": "X", "email": S_EMAIL, "password": PASSWORD}, timeout=30).status_code == 409)
check("invalid role rejected (400)",
      requests.post(f"{BASE}/api/register", json={
          "name": "X", "email": f"x{STAMP}@t.com", "password": PASSWORD,
          "role": "admin"}, timeout=30).status_code == 400)
check("short password rejected (400)",
      requests.post(f"{BASE}/api/register", json={
          "name": "X", "email": f"y{STAMP}@t.com", "password": "short"}, timeout=30).status_code == 400)
check("bad email rejected (400)",
      requests.post(f"{BASE}/api/register", json={
          "name": "X", "email": "not-an-email", "password": PASSWORD}, timeout=30).status_code == 400)
check("login wrong password rejected (401)",
      requests.post(f"{BASE}/api/login", json={
          "email": S_EMAIL, "password": "wrongwrong1"}, timeout=30).status_code == 401)

me = s().get(f"{BASE}/api/me", timeout=30).json()
check("/api/me returns role for logged-in user",
      me["user"] is not None and me["user"]["role"] == "student")

out = requests.Session()
out.post(f"{BASE}/api/login", json={"email": S_EMAIL, "password": PASSWORD}, timeout=30)
out.post(f"{BASE}/api/logout", timeout=30)
check("logout clears session (/api/me → null)",
      out.get(f"{BASE}/api/me", timeout=30).json()["user"] is None)

print()
print("=" * 60)
print("PHASE B — PROFILES")
print("=" * 60)

anon = requests.Session()
check("GET /api/profile without login (401)",
      anon.get(f"{BASE}/api/profile", timeout=30).status_code == 401)

stu = s()
p = stu.get(f"{BASE}/api/profile", timeout=30).json()["profile"]
check("GET /api/profile returns real fields", p["email"] == S_EMAIL)

pr = stu.put(f"{BASE}/api/profile", json={
    "college": "Audit University", "degree_branch": "B.Tech CSE",
    "graduation_year": 2026, "profile_skills": "Python, SQL",
    "bio": "audit bio"}, timeout=30).json()["profile"]
check("student PUT saves all student fields",
      pr["college"] == "Audit University" and pr["graduation_year"] == 2026)

pr2 = stu.put(f"{BASE}/api/profile", json={"company": "Hacker Corp"}, timeout=30).json()["profile"]
check("student CANNOT set recruiter 'company' field", pr2["company"] is None)

check("invalid graduation year rejected (400)",
      stu.put(f"{BASE}/api/profile", json={"graduation_year": 1850}, timeout=30).status_code == 400)
check("invalid avatar rejected (400)",
      stu.put(f"{BASE}/api/profile", json={"avatar": "not-an-image"}, timeout=30).status_code == 400)
tiny_png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
check("valid tiny avatar accepted",
      stu.put(f"{BASE}/api/profile", json={"avatar": tiny_png}, timeout=30)
      .json()["profile"]["avatar"] is not None)

check("password change with wrong current (400)",
      stu.post(f"{BASE}/api/account/password", json={
          "current_password": "wrongwrong1", "new_password": "newpass12345"},
          timeout=30).status_code == 400)
check("password change with short new (400)",
      stu.post(f"{BASE}/api/account/password", json={
          "current_password": PASSWORD, "new_password": "short"},
          timeout=30).status_code == 400)
ok = stu.post(f"{BASE}/api/account/password", json={
    "current_password": PASSWORD, "new_password": "newpass12345"}, timeout=30)
check("password change succeeds", ok.status_code == 200)
S_PASSWORD = "newpass12345"   # keep the student login helper in sync
check("login with NEW password works",
      requests.post(f"{BASE}/api/login", json={
          "email": S_EMAIL, "password": "newpass12345"}, timeout=30).status_code == 200)

print()
print("=" * 60)
print("PHASE C — STUDENT AGENT")
print("=" * 60)

guest = requests.Session()
long_jd = "x" * 20001
check("guest CAN analyze (allowed by design)",
      requests.post(f"{BASE}/api/analyze-resume", timeout=60).status_code in (400, 200))
check("recruiter role blocked from student tool (403)",
      r_().post(f"{BASE}/api/analyze-resume",
                data={"job_description": "test"},
                files={"file": ("a.pdf", b"%PDF-fake", "application/pdf")},
                timeout=30).status_code == 403)
check("missing job description rejected (400)",
      s().post(f"{BASE}/api/analyze-resume",
               files={"file": ("a.pdf", b"%PDF-fake", "application/pdf")},
               timeout=30).status_code == 400)
check("over-long JD rejected (400)",
      s().post(f"{BASE}/api/analyze-resume",
               data={"job_description": long_jd},
               files={"file": ("a.pdf", b"%PDF-fake", "application/pdf")},
               timeout=30).status_code == 400)
check("missing file rejected (400)",
      s().post(f"{BASE}/api/analyze-resume", data={"job_description": "Python dev"},
               timeout=30).status_code == 400)
check("non-PDF file rejected (400)",
      s().post(f"{BASE}/api/analyze-resume",
               data={"job_description": "Python dev"},
               files={"file": ("a.txt", b"hello", "text/plain")},
               timeout=30).status_code == 400)

with open("sample_data/resume_rohan_iyer.pdf", "rb") as f:
    rohan = f.read()
ai_jd = ("We are hiring an AI/ML engineer intern. Requirements: Python, Machine "
         "Learning, Data Analysis, Pandas, SQL. Familiarity with LLM APIs and "
         "vector databases (Pinecone, Qdrant) and MLOps is a plus.")
res = s().post(f"{BASE}/api/analyze-resume",
               data={"job_description": ai_jd, "job_title": "AI/ML Intern"},
               files={"file": ("resume_rohan_iyer.pdf", rohan, "application/pdf")},
               timeout=120).json()
a = res.get("analysis", {})
check("valid analysis returns all key fields",
      res.get("success") and "score" in a and "simple_score" in a
      and "score_explanation" in a and "category_breakdown" in a
      and "resume_sections" in res.get("extracted", {})
      and len(res["extracted"]["resume_sections"]) > 0
      and "ai_detected_jd_terms" in a,
      f"keys: score={'score' in a}, simple={'simple_score' in a}, "
      f"sections={list(res.get('extracted', {}).get('resume_sections', {}).keys())}")
check("analysis found expected matched skills",
      {"Python", "Machine Learning", "Pandas"} <=
      {m["name"] for m in res["analysis"]["matched"]})

print()
print("=" * 60)
print("PHASE D — RECRUITER AGENT")
print("=" * 60)

check("student role blocked from recruiter tool (403)",
      s().post(f"{BASE}/api/screen-candidates", data={"job_description": "test"},
               files={"files": ("a.pdf", b"%PDF-fake", "application/pdf")},
               timeout=30).status_code == 403)
check("no files rejected (400)",
      r_().post(f"{BASE}/api/screen-candidates", data={"job_description": "test"},
                timeout=30).status_code == 400)

with open("sample_data/resume_aarav_sharma.pdf", "rb") as f:
    aarav = f.read()
mixed = r_().post(f"{BASE}/api/screen-candidates",
                  data={"job_description": "Python developer. Skills: Python, SQL."},
                  files=[("files", ("good.pdf", rohan, "application/pdf")),
                         ("files", ("bad.txt", b"not a pdf", "text/plain"))],
                  timeout=120).json()
check("mixed batch: good files succeed AND bad file reported",
      mixed["success"] and len(mixed["candidates"]) == 1 and len(mixed["errors"]) == 1)

full = r_().post(f"{BASE}/api/screen-candidates",
                 data={"job_description": ai_jd, "job_title": "AI/ML Intern"},
                 files=[("files", ("a.pdf", aarav, "application/pdf")),
                        ("files", ("r.pdf", rohan, "application/pdf"))],
                 timeout=180).json()
cands = full["candidates"]
check("2-resume screening ranked with weighted scores",
      full["success"] and len(cands) == 2
      and cands[0]["rank"] == 1 and cands[0]["score"] >= cands[1]["score"])
check("data profile (Rohan) ranks above full-stack profile for AI job",
      cands[0]["parsed_name"] == "Rohan Iyer")

print()
print("=" * 60)
print("PHASE E — HISTORY & DATA ISOLATION")
print("=" * 60)

check("save without login (401)",
      requests.post(f"{BASE}/api/save-analysis", json={
          "module_type": "student", "payload": {}}, timeout=30).status_code == 401)
check("invalid module_type rejected (400)",
      s().post(f"{BASE}/api/save-analysis", json={
          "module_type": "hacker", "payload": {}}, timeout=30).status_code == 400)
saved = s().post(f"{BASE}/api/save-analysis", json={
    "module_type": "student", "job_title": "Audit Job", "score": 55,
    "payload": {"matched": ["Python"], "missing": ["SQL"]}}, timeout=30).json()
check("save returns record id", saved.get("success") is True and "id" in saved)
stu_list = s().get(f"{BASE}/api/my-analyses", timeout=30).json()["analyses"]
check("student history contains the saved record",
      any(a["id"] == saved["id"] for a in stu_list))
rec_list = r_().get(f"{BASE}/api/my-analyses", timeout=30).json()["analyses"]
check("DATA ISOLATION: recruiter cannot see student's record",
      not any(a["id"] == saved["id"] for a in rec_list))

print()
print("=" * 60)
print("PHASE F — ZIVA AI")
print("=" * 60)

check("ZIVA chat without login (401)",
      requests.post(f"{BASE}/api/ziva/chat", json={"message": "hi"}, timeout=30).status_code == 401)
z = s().post(f"{BASE}/api/ziva/chat", json={
    "message": "In one sentence: what is a skill gap?"}, timeout=90)
zd = z.json()
check("ZIVA replies when configured (LLM call)",
      z.status_code == 200 and zd.get("success") and len(zd.get("reply", "")) > 20,
      f"status={z.status_code} resp={str(zd)[:120]}")

print("(rate-limit check: sending 15 rapid messages…)")
limited = None
for i in range(16):
    zz = s().post(f"{BASE}/api/ziva/chat", json={"message": "hi"}, timeout=90)
    if zz.status_code == 429:
        limited = i + 1
        break
check("rate limiter kicks in (429 after burst)", limited is not None,
      f"triggered at message {limited}" if limited else "never triggered")

print()
print("=" * 60)
print("PHASE G — SECURITY EXTRAS")
print("=" * 60)

check("oversized upload rejected (413)",
      s().post(f"{BASE}/api/analyze-resume",
               data={"job_description": "Python dev"},
               files={"file": ("big.pdf", b"%PDF-" + b"x" * (21 * 1024 * 1024), "application/pdf")},
               timeout=60).status_code == 413)
check("hello route alive",
      requests.get(f"{BASE}/api/hello", timeout=30).status_code == 200)

# ---------------------------------------------------------------------
passed = sum(1 for _, ok, _ in results if ok)
failed = sum(1 for _, ok, _ in results if not ok)
print()
print("=" * 60)
print(f"RESULT: {passed} PASSED, {failed} FAILED out of {len(results)} tests")
print("=" * 60)
for name, ok, detail in results:
    if not ok:
        print(f"  FAILED: {name} — {detail}")
sys.exit(1 if failed else 0)
