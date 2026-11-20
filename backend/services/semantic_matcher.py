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
_emb_cache = {}   # text → vector cache (repeated texts are free to compare)
_EMB_CACHE_LIMIT = 600


def _encode_cached(model, texts):
    """
    Encode texts with a per-process vector cache. In recruiter batches the
    same missing-skill texts recur across candidates, so caching avoids
    re-encoding identical texts (pure speed win, identical results).
    """
    import numpy as np

    out = [None] * len(texts)
    todo_idx, todo_texts = [], []
    for i, t in enumerate(texts):
        cached = _emb_cache.get(t)
        if cached is not None:
            out[i] = cached
        else:
            todo_idx.append(i)
            todo_texts.append(t)
    if todo_texts:
        new_vecs = model.encode(todo_texts, normalize_embeddings=True)
        for i, v in zip(todo_idx, new_vecs):
            out[i] = v
            if len(_emb_cache) < _EMB_CACHE_LIMIT:
                _emb_cache[todo_texts[i]] = v
    return np.array(out)


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
        # Vectors are CACHED per text: in recruiter batches the same
        # missing-skill texts repeat across candidates, so repeats are free.
        emb_missing = _encode_cached(model, missing_texts)
        emb_extra = _encode_cached(model, extra_texts)

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
