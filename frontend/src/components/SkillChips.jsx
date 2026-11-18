// SkillChips.jsx — two tiny reusable display pieces:
//   SkillChips    → colored pills for skill names (green/red/gray/amber)
//   EvidenceList  → the exact resume line where each skill was found

export function SkillChips({ items, variant = 'gray' }) {
  return (
    <div>
      {(items || []).map((s) => (
        <span key={s.name} className={`chip ${variant}`} title={s.category}>
          {s.name}
        </span>
      ))}
      {(items || []).length === 0 && <span className="note">None found.</span>}
    </div>
  )
}

export function EvidenceList({ items }) {
  return (
    <ul className="evidence-list">
      {(items || []).map((s) => (
        <li key={s.name}>
          <b>{s.name}</b> — found in: “{s.evidence}”
        </li>
      ))}
      {(items || []).length === 0 && <li>No evidence available.</li>}
    </ul>
  )
}
