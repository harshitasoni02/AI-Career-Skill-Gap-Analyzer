"""
make_sample_resume.py — creates a small test PDF resume
=========================================================

Why does this exist? So we always have a known-good PDF to test with,
even before you upload your own real resume.

(The student below is FICTIONAL — placeholder data for testing.)

Run it from the backend folder with:
    python sample_data/make_sample_resume.py

It creates: sample_data/sample_resume.pdf
"""

import os
import pymupdf   # PyMuPDF can CREATE PDFs too, not just read them!

# The pretend resume, line by line.
LINES = [
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
]

# Build the PDF, one line at a time, moving down the page.
doc = pymupdf.open()     # create a NEW empty PDF document
page = doc.new_page()    # add one blank A4 page
y = 72                   # start 72 points from the top edge
for line in LINES:
    page.insert_text((72, y), line, fontsize=11, fontname="helv")
    y += 16              # move down 16 points for the next line

# Save it next to this script.
output_path = os.path.join(os.path.dirname(__file__), "sample_resume.pdf")
doc.save(output_path)
doc.close()
print(f"Created: {output_path}")
