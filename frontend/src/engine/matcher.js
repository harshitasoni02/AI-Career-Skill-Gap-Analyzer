// matcher.js — compares résumé skills against required skills and scores them.
//
// Direct port of backend/services/matcher.py. Two transparent scores, both with
// their formula returned so the UI can show the arithmetic:
//
//   1. SIMPLE COVERAGE   matched ÷ required × 100
//   2. WEIGHTED          Σ weight(matched) ÷ Σ weight(required) × 100
//
// Core technical skills weigh more than tools and soft skills, because a job
// listing needs its main technologies more than it needs "public speaking".

export const CATEGORY_WEIGHTS = {
  'Programming Language': 3,
  'Web Development': 3,
  Database: 3,
  'Data Science & AI': 3,
  'Mobile Development': 3,
  'Cloud & DevOps': 2,
  'CS Fundamentals': 2,
  'Tools & Software': 1,
  'Soft Skill': 1,
}

const DEFAULT_WEIGHT = 2

function weightFor(category) {
  return CATEGORY_WEIGHTS[category] ?? DEFAULT_WEIGHT
}

export function analyzeMatch(resumeSkills, requiredSkills) {
  const resumeByName = new Map(
    resumeSkills.map((s) => [s.name.toLowerCase(), s]),
  )

  const matched = []
  const missing = []

  for (const req of requiredSkills) {
    const hit = resumeByName.get(req.name.toLowerCase())
    if (hit) {
      matched.push({
        name: req.name,
        category: req.category,
        evidence: hit.evidence, // proof line from the résumé
      })
    } else {
      missing.push({ name: req.name, category: req.category })
    }
  }

  // Résumé skills the job did not ask for — a nice bonus list.
  const requiredNames = new Set(requiredSkills.map((r) => r.name.toLowerCase()))
  const extra = resumeSkills.filter(
    (s) => !requiredNames.has(s.name.toLowerCase()),
  )

  // --- Score 1: simple coverage ---
  let score = 0
  let scoreExplanation
  if (requiredSkills.length > 0) {
    score = Math.round((matched.length / requiredSkills.length) * 1000) / 10
    scoreExplanation =
      `Simple score = matched ÷ required × 100 = ${matched.length} ÷ ` +
      `${requiredSkills.length} × 100 = ${score}%`
  } else {
    scoreExplanation =
      'No skills from our dictionary were detected in the job description, ' +
      'so no score could be computed.'
  }

  // --- Score 2: weighted (core skills matter more) ---
  let weightedScore = 0
  let weightedExplanation
  if (requiredSkills.length > 0) {
    const totalWeight = requiredSkills.reduce(
      (sum, r) => sum + weightFor(r.category),
      0,
    )
    const matchedWeight = matched.reduce((sum, m) => sum + weightFor(m.category), 0)
    weightedScore = Math.round((matchedWeight / totalWeight) * 1000) / 10
    weightedExplanation =
      `Weighted score = Σ weight(matched) ÷ Σ weight(required) × 100 ` +
      `= ${matchedWeight} ÷ ${totalWeight} × 100 = ${weightedScore}%. ` +
      `Core technical skills weigh 3, fundamentals and cloud weigh 2, ` +
      `tools and soft skills weigh 1.`
  } else {
    weightedExplanation =
      'No dictionary skills detected in the job description, so no weighted score.'
  }

  // --- Category breakdown (e.g. 2 of 3 database skills present) ---
  const breakdown = {}
  for (const req of requiredSkills) {
    if (!breakdown[req.category]) {
      breakdown[req.category] = { total: 0, matched: 0 }
    }
    breakdown[req.category].total += 1
    if (resumeByName.has(req.name.toLowerCase())) {
      breakdown[req.category].matched += 1
    }
  }

  const weightsUsed = {}
  for (const category of Object.keys(breakdown)) {
    weightsUsed[category] = weightFor(category)
  }

  return {
    score,
    score_explanation: scoreExplanation,
    weighted_score: weightedScore,
    weighted_score_explanation: weightedExplanation,
    matched,
    missing,
    extra,
    category_breakdown: breakdown,
    weights_used: weightsUsed,
  }
}
