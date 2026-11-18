"""
suggester.py — AI-GENERATED advice (clearly separated from extracted data!)
==========================================================================

Everything in this file is OPINION/ADVICE produced by rules we wrote —
NOT facts extracted from the resume. The frontend labels these sections
"AI-generated" so users never confuse advice with extracted data.
"""

# Study pointers for popular skills. We only list stable, well-known,
# free resources. Skills not in this dict get a generic (honest) hint.
RESOURCES = {
    "Python": ["Official tutorial: docs.python.org/3/tutorial", "freeCodeCamp Python course (YouTube)"],
    "Java": ["W3Schools Java tutorial", "Oracle Java tutorials"],
    "C": ["Learn-C.org interactive lessons"],
    "C++": ["W3Schools C++ tutorial", "cppreference.com for details"],
    "JavaScript": ["javascript.info (Modern JavaScript Tutorial, free)", "freeCodeCamp"],
    "TypeScript": ["Official handbook: typescriptlang.org/docs"],
    "React": ["Official tutorial: react.dev/learn", "Practice: build a small to-do app"],
    "Angular": ["Official tutorial: angular.dev"],
    "Vue.js": ["Official guide: vuejs.org/guide"],
    "Node.js": ["Official learn section: nodejs.org/en/learn"],
    "Express.js": ["Official guide: expressjs.com"],
    "Django": ["Official tutorial: docs.djangoproject.com"],
    "Flask": ["Official tutorial: flask.palletsprojects.com"],
    "SQL": ["SQLBolt interactive lessons: sqlbolt.com", "W3Schools SQL section"],
    "MySQL": ["Official docs: dev.mysql.com/doc", "SQLBolt for query practice"],
    "PostgreSQL": ["Official tutorial: postgresql.org/docs"],
    "MongoDB": ["MongoDB University free courses: mongodb.com/university"],
    "Data Structures": ["NeetCode free roadmap: neetcode.io", "GeeksforGeeks DSA section"],
    "Algorithms": ["Visualgo.net visualizations", "NeetCode free roadmap"],
    "Object-Oriented Programming": ["Search 'OOP concepts explained', then practice in your main language"],
    "DBMS": ["NPTEL DBMS course (free)", "GeeksforGeeks DBMS notes"],
    "Operating Systems": ["NPTEL OS course (free)", "OSTEP book (free online)"],
    "Computer Networks": ["NPTEL Computer Networks course (free)"],
    "Machine Learning": ["Kaggle Learn free micro-courses: kaggle.com/learn", "Andrew Ng's ML course (Coursera, free to audit)"],
    "Deep Learning": ["fast.ai free course", "Kaggle Learn"],
    "Natural Language Processing": ["Hugging Face free course: huggingface.co/learn"],
    "Data Science": ["Kaggle Learn free micro-courses: kaggle.com/learn"],
    "Pandas": ["Official 10-minute guide: pandas.pydata.org", "Kaggle Learn Pandas"],
    "NumPy": ["Official tutorial: numpy.org"],
    "TensorFlow": ["Official tutorials: tensorflow.org"],
    "PyTorch": ["Official tutorials: pytorch.org/tutorials"],
    "Git": ["learngitbranching.js.org (free, interactive)"],
    "GitHub": ["GitHub Skills (free): skills.github.com"],
    "Docker": ["Official get-started guide: docs.docker.com"],
    "AWS": ["AWS Skill Builder (free tier): skillbuilder.aws"],
    "Microsoft Azure": ["Microsoft Learn free paths: learn.microsoft.com"],
    "Linux": ["Linux Journey (free): linuxjourney.com"],
    "Power BI": ["Microsoft Learn free Power BI paths: learn.microsoft.com"],
    "Tableau": ["Tableau free training videos: tableau.com/learn/training"],
    "HTML": ["W3Schools HTML tutorial", "MDN Web Docs"],
    "CSS": ["web.dev Learn CSS (free)", "MDN Web Docs"],
    "Spring Boot": ["Official guides: spring.io/guides"],
    "Bootstrap": ["Official docs: getbootstrap.com"],
    "Flutter": ["Official codelabs: docs.flutter.dev"],
    "Excel": ["Microsoft Learn free Excel training"],
    "Communication": ["Practice explaining a project in 2 minutes; join a tech club"],
    "Problem Solving": ["Daily easy problems on LeetCode", "Project Euler puzzles"],
}


def _resource_hint(skill_name):
    """Return study pointers for a skill (specific if known, generic if not)."""
    return RESOURCES.get(
        skill_name,
        [
            f"Search YouTube for '{skill_name} tutorial for beginners'",
            "Start with the official documentation",
        ],
    )


def generate_suggestions(match_result, resume_info, resume_text):
    """Rule-based resume improvement tips. Returns a list of strings."""
    tips = []

    # Tips about missing skills.
    for m in match_result["missing"][:8]:
        tips.append(
            f"'{m['name']}' is required for this role but was not found in your "
            "resume. Learn the basics, build ONE small project with it, and only "
            "then add it to your resume honestly."
        )

    # Tips about resume hygiene (based on what the parser did/didn't find).
    if not resume_info.get("email"):
        tips.append("No email address was detected. Add a professional-looking "
                    "email at the top of your resume — recruiters need it.")
    if not resume_info.get("phone"):
        tips.append("No phone number was detected. Add one with country code (e.g. +91 ...).")
    if not resume_info.get("linkedin"):
        tips.append("No LinkedIn link was detected. Add your profile URL — recruiters check it often.")
    if "project" not in resume_text.lower():
        tips.append("No PROJECTS section detected. Even 2 small projects make a "
                    "student resume far stronger — describe what you built, the tools "
                    "used, and the result.")
    if len(resume_text) < 800:
        tips.append(f"Your resume text is quite short ({len(resume_text)} characters). "
                    "Add details: what you built, tools used, measurable results.")
    if "certif" not in resume_text.lower() and "course" not in resume_text.lower():
        tips.append("Consider adding a CERTIFICATIONS section — free courses with "
                    "certificates show initiative.")

    return tips


def generate_roadmap(missing_skills):
    """
    Turn missing skills into a 3-phase learning roadmap:
      Phase 1: foundations (languages + CS fundamentals)
      Phase 2: core role skills (web/db/AI/cloud/mobile)
      Phase 3: tools, practice & soft skills
    """
    phase1_cats = {"Programming Language", "CS Fundamentals"}
    phase2_cats = {"Web Development", "Database", "Data Science & AI",
                   "Cloud & DevOps", "Mobile Development"}

    p1, p2, p3 = [], [], []
    for s in missing_skills:
        item = {"skill": s["name"], "resource_hints": _resource_hint(s["name"])}
        if s["category"] in phase1_cats:
            p1.append(item)
        elif s["category"] in phase2_cats:
            p2.append(item)
        else:
            p3.append(item)

    def phase(num, title, why, skills):
        return {
            "phase": num,
            "title": title,
            "why": why,
            "suggested_duration": f"roughly 1–3 weeks per skill (adjust to your pace; "
                                  f"{len(skills)} skill(s) in this phase)",
            "skills": skills,
            "empty_note": None if skills else "Nothing to learn in this phase — nice!",
        }

    return [
        phase(1, "Phase 1 — Foundations first",
              "Languages and CS fundamentals are the base for everything else.", p1),
        phase(2, "Phase 2 — Core role skills",
              "These are the main technical skills the job actually uses.", p2),
        phase(3, "Phase 3 — Tools, practice & soft skills",
              "Tools make you productive; soft skills make you hireable.", p3),
    ]
