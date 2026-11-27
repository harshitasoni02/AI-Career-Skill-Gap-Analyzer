// suggester.js — rule-based advice, clearly separated from extracted facts.
//
// Direct port of backend/services/suggester.py. Everything here is opinion
// produced by our own rules, NOT facts read from the résumé, which is why the
// UI labels these sections "AI-generated".

const RESOURCES = {
  Python: ['Official tutorial: docs.python.org/3/tutorial', 'freeCodeCamp Python course (YouTube)'],
  Java: ['W3Schools Java tutorial', 'Oracle Java tutorials'],
  C: ['Learn-C.org interactive lessons'],
  'C++': ['W3Schools C++ tutorial', 'cppreference.com for details'],
  JavaScript: ['javascript.info (Modern JavaScript Tutorial, free)', 'freeCodeCamp'],
  TypeScript: ['Official handbook: typescriptlang.org/docs'],
  React: ['Official tutorial: react.dev/learn', 'Practice: build a small to-do app'],
  Angular: ['Official tutorial: angular.dev'],
  'Vue.js': ['Official guide: vuejs.org/guide'],
  'Node.js': ['Official learn section: nodejs.org/en/learn'],
  'Express.js': ['Official guide: expressjs.com'],
  Django: ['Official tutorial: docs.djangoproject.com'],
  Flask: ['Official tutorial: flask.palletsprojects.com'],
  SQL: ['SQLBolt interactive lessons: sqlbolt.com', 'W3Schools SQL section'],
  MySQL: ['Official docs: dev.mysql.com/doc', 'SQLBolt for query practice'],
  PostgreSQL: ['Official tutorial: postgresql.org/docs'],
  MongoDB: ['MongoDB University free courses: mongodb.com/university'],
  'Data Structures': ['NeetCode free roadmap: neetcode.io', 'GeeksforGeeks DSA section'],
  Algorithms: ['Visualgo.net visualizations', 'NeetCode free roadmap'],
  'Object-Oriented Programming': ["Search 'OOP concepts explained', then practice in your main language"],
  DBMS: ['NPTEL DBMS course (free)', 'GeeksforGeeks DBMS notes'],
  'Operating Systems': ['NPTEL OS course (free)', 'OSTEP book (free online)'],
  'Computer Networks': ['NPTEL Computer Networks course (free)'],
  'Machine Learning': ['Kaggle Learn free micro-courses: kaggle.com/learn', "Andrew Ng's ML course (Coursera, free to audit)"],
  'Deep Learning': ['fast.ai free course', 'Kaggle Learn'],
  'Natural Language Processing': ['Hugging Face free course: huggingface.co/learn'],
  'Data Science': ['Kaggle Learn free micro-courses: kaggle.com/learn'],
  Pandas: ['Official 10-minute guide: pandas.pydata.org', 'Kaggle Learn Pandas'],
  NumPy: ['Official tutorial: numpy.org'],
  TensorFlow: ['Official tutorials: tensorflow.org'],
  PyTorch: ['Official tutorials: pytorch.org/tutorials'],
  Git: ['learngitbranching.js.org (free, interactive)'],
  GitHub: ['GitHub Skills (free): skills.github.com'],
  Docker: ['Official get-started guide: docs.docker.com'],
  AWS: ['AWS Skill Builder (free tier): skillbuilder.aws'],
  'Microsoft Azure': ['Microsoft Learn free paths: learn.microsoft.com'],
  Linux: ['Linux Journey (free): linuxjourney.com'],
  'Power BI': ['Microsoft Learn free Power BI paths: learn.microsoft.com'],
  Tableau: ['Tableau free training videos: tableau.com/learn/training'],
  HTML: ['W3Schools HTML tutorial', 'MDN Web Docs'],
  CSS: ['web.dev Learn CSS (free)', 'MDN Web Docs'],
  'Spring Boot': ['Official guides: spring.io/guides'],
  Bootstrap: ['Official docs: getbootstrap.com'],
  Flutter: ['Official codelabs: docs.flutter.dev'],
  Excel: ['Microsoft Learn free Excel training'],
  Communication: ['Practice explaining a project in 2 minutes; join a tech club'],
  'Problem Solving': ['Daily easy problems on LeetCode', 'Project Euler puzzles'],
}

function resourceHint(skillName) {
  return (
    RESOURCES[skillName] || [
      `Search YouTube for '${skillName} tutorial for beginners'`,
      'Start with the official documentation',
    ]
  )
}

export function generateSuggestions(matchResult, resumeInfo, resumeText) {
  const tips = []

  // Tips about missing skills.
  for (const m of matchResult.missing.slice(0, 8)) {
    tips.push(
      `'${m.name}' is required for this role but was not found in your ` +
        'resume. Learn the basics, build ONE small project with it, and only ' +
        'then add it to your resume honestly.',
    )
  }

  // Résumé hygiene, based on what the parser could and could not find.
  if (!resumeInfo.email) {
    tips.push(
      'No email address was detected. Add a professional-looking email at the ' +
        'top of your résumé — recruiters need it.',
    )
  }
  if (!resumeInfo.phone) {
    tips.push('No phone number was detected. Add one with country code (e.g. +91 ...).')
  }
  if (!resumeInfo.linkedin) {
    tips.push('No LinkedIn link was detected. Add your profile URL — recruiters check it often.')
  }
  const lower = String(resumeText || '').toLowerCase()
  if (!lower.includes('project')) {
    tips.push(
      'No PROJECTS section detected. Even 2 small projects make a student ' +
        'résumé far stronger — describe what you built, the tools used, and the result.',
    )
  }
  if (String(resumeText || '').length < 800) {
    tips.push(
      `Your résumé text is quite short (${String(resumeText || '').length} ` +
        'characters). Add details: what you built, tools used, measurable results.',
    )
  }
  if (!lower.includes('certif') && !lower.includes('course')) {
    tips.push(
      'Consider adding a CERTIFICATIONS section — free courses with ' +
        'certificates show initiative.',
    )
  }

  return tips
}

export function generateRoadmap(missingSkills) {
  const PHASE1 = new Set(['Programming Language', 'CS Fundamentals'])
  const PHASE2 = new Set([
    'Web Development',
    'Database',
    'Data Science & AI',
    'Cloud & DevOps',
    'Mobile Development',
  ])

  const p1 = []
  const p2 = []
  const p3 = []

  for (const s of missingSkills) {
    const item = { skill: s.name, resource_hints: resourceHint(s.name) }
    if (PHASE1.has(s.category)) p1.push(item)
    else if (PHASE2.has(s.category)) p2.push(item)
    else p3.push(item)
  }

  const phase = (num, title, why, skills) => ({
    phase: num,
    title,
    why,
    suggested_duration:
      `roughly 1–3 weeks per skill (adjust to your pace; ${skills.length} skill(s) in this phase)`,
    skills,
    empty_note: skills.length ? null : 'Nothing to learn in this phase — nice!',
  })

  return [
    phase(1, 'Phase 1 — Foundations first', 'Languages and CS fundamentals are the base for everything else.', p1),
    phase(2, 'Phase 2 — Core role skills', 'These are the main technical skills the job actually uses.', p2),
    phase(3, 'Phase 3 — Tools, practice & soft skills', 'Tools make you productive; soft skills make you hireable.', p3),
  ]
}
