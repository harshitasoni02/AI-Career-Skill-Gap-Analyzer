"""
semantic_matcher.py — OPTIONAL "meaning-based" matching
========================================================

Keyword matching only finds EXACT words. This module compares MEANING:
e.g. a resume says "built RESTful services" while the job asks for
"REST API" — keywords miss it, semantics catch it.

HONESTY RULES (from our project spec — very important):
- Semantic similarity is NOT proof that someone has a skill.
- Results are labeled "AI-estimated — needs human review" and are
  NEVER added to the hard match score. They are a separate list.
- If the library or model is unavailable, everything silently falls
  back to keyword-only matching. The app never crashes over this.
"""

_model = None     # cached model so we load it only once
_failed = False   # don't retry forever if it's simply not installed


def get_model():
    """Load the Sentence Transformer model once; return None if unavailable."""
    global _model, _failed
    if _model is not None:
        return _model
    if _failed:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        from config import SEMANTIC_MODEL
        _model = SentenceTransformer(SEMANTIC_MODEL)
        return _model
    except Exception:
        # Library missing, model download failed, no internet, etc.
        _failed = True
        return None


def find_possible_matches(missing_skills, extra_skills, threshold=0.60):
    """
    For each required-but-missing skill, find the resume's "extra" skill
    that is MOST SIMILAR in meaning. Only pairs above `threshold` are kept.

    Returns a list of possible-match dicts (possibly empty).
    """
    model = get_model()
    if model is None or not missing_skills or not extra_skills:
        return []

    try:
        from sentence_transformers import util

        missing_texts = [f"{s['name']} ({s['category']})" for s in missing_skills]
        extra_texts = [f"{s['name']} — {s['evidence']}" for s in extra_skills]

        # encode() turns each text into a list of numbers (a "vector")
        # that represents its meaning. Similar meanings → similar vectors.
        emb_missing = model.encode(missing_texts, normalize_embeddings=True)
        emb_extra = model.encode(extra_texts, normalize_embeddings=True)

        # cosine similarity: how "aligned" two vectors are (0 = unrelated, 1 = same)
        sims = util.cos_sim(emb_missing, emb_extra)

        results = []
        for i, miss in enumerate(missing_skills):
            best_j = max(range(len(extra_texts)), key=lambda j: float(sims[i][j]))
            best_score = float(sims[i][best_j])
            if best_score >= threshold:
                results.append({
                    "missing_skill": miss["name"],
                    "resume_skill": extra_skills[best_j]["name"],
                    "resume_evidence": extra_skills[best_j]["evidence"],
                    "similarity": round(best_score * 100, 1),
                    "note": ("AI-estimated possible match based on meaning — "
                             "NOT counted in the score. Human review required."),
                })
        return results
    except Exception:
        # Any surprise → keyword-only behavior. Never break the analysis.
        return []
