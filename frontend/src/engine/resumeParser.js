// resumeParser.js — pulls structured information out of résumé text.
//
// Direct port of backend/services/resume_parser.py. Two jobs:
//   1. parseResumeInfo() — contact info (name, email, phone, LinkedIn)
//   2. extractSections() — split the résumé into education/skills/projects...
//
// These are heuristics, not perfect understanding, which is why the UI labels
// the name "estimated". The project rule is to distinguish extracted facts from
// guesses; nothing here is presented as certain.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
const PHONE_RE = /(\+?\d[\d\s\-()]{8,15}\d)/
const LINKEDIN_RE = /(linkedin\.com\/[A-Za-z0-9_\-/.]+)/i

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export function parseResumeInfo(text) {
  const source = String(text || '')
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const email = source.match(EMAIL_RE)
  const phone = source.match(PHONE_RE)
  const linkedin = source.match(LINKEDIN_RE)

  // Name heuristic: résumés usually open with the person's name, so look at the
  // first few short, mostly-alphabetic lines that are not contact info.
  let name = null
  for (const line of lines.slice(0, 6)) {
    if (EMAIL_RE.test(line) || PHONE_RE.test(line)) continue
    if (line.length < 2 || line.length > 50) continue
    const letters = [...line].filter((ch) => /[a-z]/i.test(ch) || /\s/.test(ch)).length
    if (letters / line.length < 0.7) continue
    const isUpper = line === line.toUpperCase() && /[A-Z]/.test(line)
    if (isUpper) {
      name = titleCase(line)
      break
    }
    if (name === null) {
      name = line // keep as a fallback guess, but keep looking
    }
  }

  return {
    name,
    name_note: name ? 'Estimated from the top of the résumé — please verify.' : null,
    email: email ? email[0] : null,
    phone: phone ? phone[0].trim() : null,
    linkedin: linkedin ? linkedin[1] : null,
  }
}

// Known résumé headings, with their singular/plural variants.
const SECTION_HEADERS = {
  education: [
    'education',
    'academic background',
    'academics',
    'educational qualification',
    'educational qualifications',
  ],
  skills: [
    'skills',
    'technical skills',
    'skills summary',
    'core skills',
    'key skills',
    'skill set',
    'technologies',
    'technical proficiency',
  ],
  projects: [
    'projects',
    'academic projects',
    'personal projects',
    'key projects',
    'projects handled',
    'mini projects',
  ],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'work history',
    'employment history',
    'internships',
    'internship experience',
    'training experience',
  ],
  certifications: [
    'certifications',
    'certificates',
    'licenses & certifications',
    'courses and certifications',
    'certification',
  ],
  achievements: [
    'achievements',
    'awards',
    'honors',
    'honours',
    'accomplishments',
    'extracurricular activities',
    'extra-curricular activities',
  ],
}

function matchHeader(candidate) {
  if (!candidate || candidate.length > 40) return null
  for (const [key, names] of Object.entries(SECTION_HEADERS)) {
    for (const name of names) {
      if (
        candidate === name ||
        candidate.replace(/s$/, '') === name.replace(/s$/, '')
      ) {
        return key
      }
    }
  }
  return null
}

export function extractSections(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim())
  const collected = {}
  let current = null

  for (const line of lines) {
    // Headings are short lines like "SKILLS:", possibly bulleted.
    const candidate = line.toLowerCase().replace(/^[•\-–—:\s]+/, '').replace(/[•\-–—:\s]+$/, '')
    const header = matchHeader(candidate)
    if (header) {
      current = header
      if (!collected[current]) collected[current] = []
      continue
    }
    if (current && line) collected[current].push(line)
  }

  const result = {}
  for (const [key, value] of Object.entries(collected)) {
    const joined = value.join('\n').slice(0, 1500)
    if (joined) result[key] = joined
  }
  return result
}
