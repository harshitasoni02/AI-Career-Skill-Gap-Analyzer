"""
make_sample_resumes.py — creates 3 FICTIONAL test resumes
==========================================================

These give the recruiter module something realistic to rank in demos:
  resume_aarav_sharma.pdf → full-stack profile  (Python, React, MySQL...)
  resume_priya_verma.pdf  → Java/backend profile
  resume_rohan_iyer.pdf   → data-science profile

All names and details are FICTIONAL placeholder data.

Run from the backend folder:  python sample_data/make_sample_resumes.py
"""

import os
import pymupdf

RESUMES = {
    "resume_aarav_sharma.pdf": [
        "AARAV SHARMA",
        "B.Tech Computer Science Student",
        "Email: aarav.sharma@example.com | Phone: +91 98765 43210",
        "",
        "EDUCATION",
        "B.Tech in Computer Science and Engineering,",
        "XYZ University, CGPA 8.2 (expected 2026)",
        "",
        "SKILLS",
        "Programming Languages: Python, Java, C++",
        "Web Development: HTML, CSS, JavaScript, React, Flask",
        "Databases: MySQL",
        "Tools: Git, VS Code",
        "",
        "PROJECTS",
        "Student Attendance System - Python, MySQL, Flask",
        "Personal Portfolio Website - HTML, CSS, JavaScript, React",
        "",
        "CERTIFICATIONS",
        "Introduction to Data Science - Coursera",
    ],
    "resume_priya_verma.pdf": [
        "PRIYA VERMA",
        "B.Tech Information Technology Student",
        "Email: priya.verma@example.com | Phone: +91 90123 45678",
        "",
        "EDUCATION",
        "B.Tech in Information Technology,",
        "ABC University, CGPA 8.6 (expected 2026)",
        "",
        "SKILLS",
        "Languages: Java, SQL, HTML, CSS",
        "Frameworks: Spring Boot, Bootstrap",
        "Databases: MySQL",
        "Tools: Git, GitHub, VS Code",
        "Core Subjects: DBMS, Object-Oriented Programming, Data Structures",
        "",
        "PROJECTS",
        "Library Management System - Java, Spring Boot, MySQL, REST API",
        "College Event Website - HTML, CSS, Bootstrap, MySQL",
        "",
        "ACHIEVEMENTS",
        "Finalist, university hackathon 2025",
    ],
    "resume_rohan_iyer.pdf": [
        "ROHAN IYER",
        "B.Tech Computer Science (Data Science)",
        "Email: rohan.iyer@example.com | Phone: +91 98200 34567",
        "",
        "EDUCATION",
        "B.Tech in Computer Science with Data Science specialization,",
        "XYZ University, CGPA 8.9 (expected 2027)",
        "",
        "SKILLS",
        "Languages: Python, SQL",
        "Data: Pandas, NumPy, Machine Learning, Data Analysis, Data Visualization",
        "Visualization: Matplotlib, Power BI",
        "Databases: MySQL, PostgreSQL",
        "Tools: Git, Jupyter Notebook, Excel",
        "",
        "PROJECTS",
        "Sales Prediction Model - Python, Pandas, Machine Learning",
        "College Analytics Dashboard - Power BI, SQL",
        "",
        "CERTIFICATIONS",
        "Machine Learning Specialization - Coursera",
    ],
}

# Build each PDF the same way as make_sample_resume.py.
for filename, lines in RESUMES.items():
    doc = pymupdf.open()
    page = doc.new_page()
    y = 72
    for line in lines:
        size = 14 if y == 72 else 11          # the first line is the name → bigger
        page.insert_text((72, y), line, fontsize=size, fontname="helv")
        y += 18 if y == 72 else 16
    out = os.path.join(os.path.dirname(__file__), filename)
    doc.save(out)
    doc.close()
    print(f"Created: {out}")
