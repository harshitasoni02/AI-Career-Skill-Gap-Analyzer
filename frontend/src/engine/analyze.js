// analyze.js — the browser-side analysis engine.
//
// This mirrors backend/app.py's /api/analyze-resume and /api/screen-candidates
// so the deployed frontend works with no server at all. The response objects are
// byte-for-byte compatible with the Flask API, which means the existing result
// pages need no changes and the same résumé produces the same score either way.
//
// What is deliberately NOT ported, because it cannot run in a browser:
//   • semantic possible-matches (sentence-transformers embeddings)
//   • spaCy "AI-detected" JD terms
//   • Ziva chat (Gemini needs a server-side API key)
// Those fields are returned empty with their honest explanatory notes, so the UI
// shows "none found" rather than silently pretending the feature ran.

import { extractSkills } from './skillExtractor.js'
import { analyzeMatch } from './matcher.js'
import { parseResumeInfo, extractSections } from './resumeParser.js'
import { generateSuggestions, generateRoadmap } from './suggester.js'

const MAX_JD_CHARS = 20000

// Mirrors _analyze_single_resume() in app.py.
function analyzeSingleResume(text, jdText, jobTitle) {
  const resumeSkills = extractSkills(text).skills_found
  const jdSkills = extractSkills(jdText).skills_found
  const match = analyzeMatch(resumeSkills, jdSkills)

  const resumeInfo = parseResumeInfo(text)
  const resumeSections = extractSections(text)
  const suggestions = generateSuggestions(match, resumeInfo, text)
  const roadmap = generateRoadmap(match.missing)

  return {
    extracted: {
      resume_info: resumeInfo,
      resume_skills: resumeSkills,
      required_skills: jdSkills,
      resume_sections: resumeSections,
    },
    match,
    suggestions,
    roadmap,
    job_title: jobTitle || 'Untitled role',
    jd_skills_count: jdSkills.length,
  }
}

function validateJobDescription(jd) {
  if (!jd) return 'Please paste the job description text.'
  if (jd.length > MAX_JD_CHARS) {
    return `Job description too long (max ${MAX_JD_CHARS.toLocaleString()} characters).`
  }
  return null
}

/**
 * Analyse one résumé against one job description.
 * @param {{text: string, filename: string, pages: number}} resume
 * @param {string} jdText
 * @param {string} jobTitle
 */
export function analyzeResume({ text, filename, pages }, jdText, jobTitle) {
  const jd = String(jdText || '').trim()
  const jdError = validateJobDescription(jd)
  if (jdError) throw new Error(jdError)

  const result = analyzeSingleResume(String(text || ''), jd, String(jobTitle || '').trim())
  const match = result.match

  // Same response shape as the Flask route.
  return {
    success: true,
    extracted: {
      ...result.extracted,
      pages: pages || 1,
      characters: String(text || '').length,
      filename,
    },
    analysis: {
      job_title: result.job_title,
      score: match.weighted_score,
      score_type: 'weighted',
      score_explanation: match.weighted_score_explanation,
      simple_score: match.score,
      simple_score_explanation: match.score_explanation,
      matched: match.matched,
      missing: match.missing,
      extra: match.extra,
      category_breakdown: match.category_breakdown,
      weights_used: match.weights_used,
      semantic_possible_matches: [],
      semantic_note: null,
      ai_detected_jd_terms: [],
      ai_detected_note: null,
    },
    ai_generated: {
      label:
        'AI-generated suggestions and roadmap — general advice from our rules, ' +
        'NOT extracted from your résumé.',
      suggestions: result.suggestions,
      roadmap: result.roadmap,
    },
    disclaimer:
      'This analysis supports human review. It does not guarantee employment or selection.',
  }
}

/**
 * Screen several résumés against one job description.
 * @param {Array<{text: string, filename: string, pages: number}>} resumes
 */
export function screenCandidates(resumes, jdText, jobTitle) {
  const jd = String(jdText || '').trim()
  const jdError = validateJobDescription(jd)
  if (jdError) throw new Error(jdError)
  if (!resumes || resumes.length === 0) {
    throw new Error('Please upload at least one résumé PDF.')
  }

  const jdSkills = extractSkills(jd).skills_found
  const candidates = []
  const errors = []

  for (const resume of resumes) {
    try {
      const text = String(resume.text || '')
      if (!text.trim()) {
        throw new Error('No readable text found in this PDF (it may be a scan).')
      }
      const resumeSkills = extractSkills(text).skills_found
      const match = analyzeMatch(resumeSkills, jdSkills)
      const info = parseResumeInfo(text)

      candidates.push({
        filename: resume.filename,
        parsed_name: info.name,
        name_note: info.name_note,
        score: match.weighted_score,
        score_type: 'weighted',
        simple_score: match.score,
        matched_count: match.matched.length,
        missing_count: match.missing.length,
        matched: match.matched,
        missing: match.missing,
        top_extra: match.extra.slice(0, 8).map((s) => s.name),
        semantic_possible_matches: [],
        score_explanation: match.weighted_score_explanation,
        simple_score_explanation: match.score_explanation,
        pages: resume.pages || 1,
      })
    } catch (err) {
      errors.push({ filename: resume.filename, error: err.message })
    }
  }

  // Rank by weighted score, ties broken by simple coverage then matched count.
  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      b.simple_score - a.simple_score ||
      b.matched_count - a.matched_count,
  )
  candidates.forEach((c, i) => {
    c.rank = i + 1
  })

  return {
    success: true,
    job: {
      title: String(jobTitle || '').trim() || 'Untitled role',
      required_skills: jdSkills,
      ai_detected_jd_terms: [],
    },
    candidates,
    errors,
    ranking_explanation:
      'Candidates are ranked by WEIGHTED skill match (core technical skills weigh 3, ' +
      'fundamentals/cloud 2, tools and soft skills 1). Ties are broken by simple ' +
      'coverage, then by number of matched skills.',
    disclaimer:
      'This ranking SUPPORTS human review — it is NOT an automatic hiring or ' +
      'rejection decision. Skills were matched by keywords with evidence; always ' +
      'verify details in the original résumés.',
  }
}
