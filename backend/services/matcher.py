"""
matcher.py — compares resume skills with required skills and scores it
======================================================================

TWO transparent scores (no black boxes — formulas are always returned):

1. SIMPLE COVERAGE SCORE
       matched ÷ required × 100
   Every required skill counts the same.

2. WEIGHTED SKILL SCORE (Phase 9b)
       Σ weight(matched) ÷ Σ weight(required) × 100
   Core technical skills (languages, web, databases, AI...) count MORE
   than tools and soft skills — because a job listing needs its main
   technologies much more than, say, "public speaking".

Definitions:
  matched  → required skills that were LITERALLY found in the resume text
  missing  → required skills NOT found in the resume text
  extra    → resume skills the job did not ask for (nice bonus to show)

Every matched skill carries its "evidence" line — the exact resume line
that proves the word appeared. We show evidence; we never just assume.
"""

# How much each skill category matters for a job match (1–3).
# These weights are visible to the user in the UI — nothing is hidden.
CATEGORY_WEIGHTS = {
    "Programming Language": 3,
    "Web Development": 3,
    "Database": 3,
    "Data Science & AI": 3,
    "Mobile Development": 3,
    "Cloud & DevOps": 2,
    "CS Fundamentals": 2,
    "Tools & Software": 1,
    "Soft Skill": 1,
}
DEFAULT_WEIGHT = 2   # for any category not listed above


def _weight(category):
    return CATEGORY_WEIGHTS.get(category, DEFAULT_WEIGHT)


def analyze_match(resume_skills, required_skills):
    """
    resume_skills    → list from skill_extractor.extract_skills (name, category, evidence)
    required_skills  → same format, extracted from the job description
    """
    # Index resume skills by lowercase name for fast lookups.
    resume_by_name = {s["name"].lower(): s for s in resume_skills}

    matched, missing = [], []
    for req in required_skills:
        hit = resume_by_name.get(req["name"].lower())
        if hit:
            matched.append({
                "name": req["name"],
                "category": req["category"],
                "evidence": hit["evidence"],   # proof line from the resume
            })
        else:
            missing.append({
                "name": req["name"],
                "category": req["category"],
            })

    # Resume skills the job didn't ask for — nice bonus list.
    required_names = {r["name"].lower() for r in required_skills}
    extra = [s for s in resume_skills if s["name"].lower() not in required_names]

    # --- Score 1: simple coverage ---
    if required_skills:
        score = round(len(matched) / len(required_skills) * 100, 1)
        explanation = (
            f"Simple score = matched ÷ required × 100 = {len(matched)} ÷ "
            f"{len(required_skills)} × 100 = {score}%"
        )
    else:
        score = 0.0
        explanation = ("No skills from our dictionary were detected in the "
                       "job description, so no score could be computed.")

    # --- Score 2: weighted (core skills matter more) ---
    if required_skills:
        total_weight = sum(_weight(r["category"]) for r in required_skills)
        matched_weight = sum(_weight(m["category"]) for m in matched)
        weighted_score = round(matched_weight / total_weight * 100, 1)
        weighted_explanation = (
            f"Weighted score = Σ weight(matched) ÷ Σ weight(required) × 100 "
            f"= {matched_weight} ÷ {total_weight} × 100 = {weighted_score}%. "
            f"Core technical skills weigh 3, fundamentals and cloud weigh 2, "
            f"tools and soft skills weigh 1."
        )
    else:
        weighted_score = 0.0
        weighted_explanation = ("No dictionary skills detected in the job "
                                "description, so no weighted score.")

    # --- Category breakdown (e.g. 2/3 Database skills present) ---
    breakdown = {}
    for r in required_skills:
        b = breakdown.setdefault(r["category"], {"total": 0, "matched": 0})
        b["total"] += 1
        if r["name"].lower() in resume_by_name:
            b["matched"] += 1

    return {
        "score": score,
        "score_explanation": explanation,
        "weighted_score": weighted_score,
        "weighted_score_explanation": weighted_explanation,
        "matched": matched,
        "missing": missing,
        "extra": extra,
        "category_breakdown": breakdown,
        "weights_used": {c: _weight(c) for c in breakdown.keys()},
    }
