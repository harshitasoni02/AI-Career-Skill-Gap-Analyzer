"""
nlp_analyzer.py — spaCy-powered job description analyzer (Phase 10)
====================================================================

Our skill dictionary is great but finite. Real job descriptions also
mention tools we haven't listed yet (e.g. "Pinecone", "LangChain").
This service uses spaCy's Named Entity Recognition (NER) to spot
POSSIBLE extra requirements in a job description.

HONESTY RULES (from our project spec):
- These are "AI-detected POSSIBLE requirements" — never presented as
  verified dictionary skills, and they do NOT change any score.
- The frontend labels them clearly for human review.
- If spaCy or the model is unavailable, we return [] and everything
  keeps working with dictionary matching only.
"""

_nlp = None     # cached model, loaded once
_failed = False # don't retry forever if spaCy simply isn't available

# Famous company names that NER often flags as ORG but that are NOT
# skills. This keeps the "possible requirements" list useful, not noisy.
_BLACKLIST = {
    "google", "microsoft", "amazon", "aws", "azure", "facebook", "meta",
    "netflix", "apple", "oracle", "ibm", "linkedin", "github", "gitlab",
    "twitter", "youtube", "coursera", "udemy", "nvidia", "openai",
    "anthropic", "uber", "flipkart", "tcs", "infosys", "wipro",
}


def get_nlp():
    """Load the small English spaCy model once; return None if unavailable."""
    global _nlp, _failed
    if _nlp is not None:
        return _nlp
    if _failed:
        return None
    try:
        import spacy
        _nlp = spacy.load("en_core_web_sm")
        return _nlp
    except Exception:
        _failed = True
        return None


def analyze_job_description(jd_text, known_skill_names):
    """
    Return a list of POSSIBLE additional requirements found in the job
    description that are NOT already covered by our skill dictionary.
    """
    nlp = get_nlp()
    if nlp is None or not jd_text:
        return []

    try:
        # Limit length so huge descriptions stay fast.
        doc = nlp(jd_text[:6000])
        known_lower = {k.lower() for k in known_skill_names}
        seen, results = set(), []

        for ent in doc.ents:
            label = ent.label_
            value = ent.text.strip()
            low = value.lower()

            # Only entity types that usually hold products/companies/tools.
            if label not in ("PRODUCT", "ORG", "WORK_OF_ART"):
                continue
            # Sensible size, no numbers, must contain letters.
            if len(value) < 2 or len(value) > 40:
                continue
            if any(ch.isdigit() for ch in value):
                continue
            if not any(ch.isalpha() for ch in value):
                continue
            # Skip known companies, dictionary skills and duplicates.
            if low in _BLACKLIST or low in known_lower or low in seen:
                continue

            seen.add(low)
            results.append(value)
            if len(results) >= 12:
                break

        return results
    except Exception:
        # Any surprise → degrade gracefully to dictionary-only behavior.
        return []
