// skillExtractor.js — finds dictionary skills inside any text.
//
// This is a direct port of backend/services/skill_extractor.py so the public
// demo can analyse a résumé entirely in the browser. The matching rules are
// identical on purpose: if the two disagree, the demo would report different
// scores than the real app for the same résumé.
//
// HOW IT WORKS:
// 1. Load the dictionary (skills.json) — each skill has a name, a category,
//    and "aliases" (other ways people write it).
// 2. For every skill, search the text for its name or aliases as WHOLE WORDS
//    only, so "C" does not match inside "CSS" and "Java" not inside "JavaScript".
// 3. For every skill found, keep the exact line where it appeared. The app's
//    rule is: show evidence, never just assume.

import SKILLS_DB from './skills.json'

const SKILLS = SKILLS_DB.skills

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// One compiled pattern per skill, built once at module load.
// (?<![a-z0-9.]) means the match must not start right after a letter, digit or
// dot (so "js" is not found inside "node.js"); (?![a-z0-9]) means it must not
// end right before a letter or digit (so "java" is not found in "javascript").
const PATTERNS = new Map(
  SKILLS.map((skill) => {
    const variants = [skill.name, ...(skill.aliases || [])]
    const body = variants.map((v) => escapeRegExp(v.toLowerCase())).join('|')
    return [skill.name, new RegExp(`(?<![a-z0-9.])(${body})(?![a-z0-9])`)]
  }),
)

export function extractSkills(text) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const lowerLines = lines.map((line) => line.toLowerCase())
  const found = new Map()

  for (const skill of SKILLS) {
    const pattern = PATTERNS.get(skill.name)
    for (let i = 0; i < lowerLines.length; i += 1) {
      if (pattern.test(lowerLines[i])) {
        found.set(skill.name, {
          name: skill.name,
          category: skill.category,
          evidence: lines[i].slice(0, 120),
        })
        break // one matching line is enough evidence for this skill
      }
    }
  }

  // Sorted by category then name, so the list reads the same as the backend's.
  const skillsList = [...found.values()].sort((a, b) => {
    if (a.category !== b.category) return a.category < b.category ? -1 : 1
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  })

  return { skills_found: skillsList, count: skillsList.length }
}

export const SKILL_COUNT = SKILLS.length
