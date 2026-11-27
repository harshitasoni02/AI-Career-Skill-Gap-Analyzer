// Icons.jsx — a small line-icon set. One visual language: 24px grid,
// 1.6px strokes, round joins. Icons are decorative and hidden from AT
// unless a label is explicitly passed.
const paths = {
  graduation: (
    <>
      <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
      <path d="M7 12v4.3c0 .5.3.9.8 1.1 1.3.6 2.7.9 4.2.9s2.9-.3 4.2-.9c.5-.2.8-.6.8-1.1V12" />
      <path d="M21 9.5v5" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v16" />
      <path d="M16 9h3c1.1 0 2 .9 2 2v10" />
      <path d="M2 21h20" />
      <path d="M8 7h4M8 11h4M8 15h4" />
    </>
  ),
  spark: (
    <path
      d="M12 3.5c.5 4.4 2.1 6 6.5 6.5-4.4.5-6 2.1-6.5 6.5-.5-4.4-2.1-6-6.5-6.5 4.4-.5 6-2.1 6.5-6.5Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  file: (
    <>
      <path d="M6 3h7l5 5v13H6V3Z" />
      <path d="M13 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5.2c0 4.9-3 8-7 9.8-4-1.8-7-4.9-7-9.8V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16.5 9" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5v16h5" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19.5 8.5l-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </>
  ),
  send: <path d="M4 20 20.5 12 4 4v6l10 2-10 2v6Z" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  eye: (
    <>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18M5 6h14" />
      <path d="M7 6 4 12h6L7 6ZM17 6l-3 6h6l-3-6Z" />
      <path d="M8 21h8" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5c3-1 5.3-.8 8 1v13.8c-2.7-1.8-5-2-8-1V5.5Z" />
      <path d="M20 5.5c-3-1-5.3-.8-8 1v13.8c2.7-1.8 5-2 8-1V5.5Z" />
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
}

export default function Icon({ name, size = 18, strokeWidth = 1.6, label, className = '' }) {
  const content = paths[name]
  if (!content) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {content}
    </svg>
  )
}
