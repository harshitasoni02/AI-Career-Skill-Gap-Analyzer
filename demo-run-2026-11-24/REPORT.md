# Full demo run — 24 Nov 2026 (final UI)

End-to-end run through the real UI (`http://127.0.0.1:5173`) and API
(`http://127.0.0.1:5000`), repeated after the editorial redesign and the Ziva
rebuild. All three AI layers were active:
`nlp_enabled=true`, `semantic_enabled=true`, `spacy_installed=true`,
`ziva_configured=true`.

## Demo assets

PDFs generated for this run (in `demo_assets/`):

| File | Profile | Expected result |
|---|---|---|
| `ananya_rao_resume.pdf` | Full-stack intern (Python, React, MySQL) | Partial match |
| `kabir_mehta_resume.pdf` | Backend dev (Python, Node.js, Docker, AWS) | Strong match |
| `meera_joshi_resume.pdf` | Marketing analyst (Excel, JavaScript) | Weak match |

Job description pasted into the app:

> Requirements: Python, React, MySQL, Node.js, Docker, Terraform, and strong
> problem solving. You will build REST APIs and work with relational databases.
> Nice to have: AWS.

## Student flow (Ananya Rao)

1. Registered a new student account in the UI.
2. Uploaded `ananya_rao_resume.pdf`, entered job title **Full Stack Developer
   Intern**, pasted the JD, clicked **Analyze my skill gap**.
3. Result: **45% weighted / 37.5% simple**.
   - Matched (3): MySQL, Python, React
   - Missing (5): AWS, Docker, Problem Solving, Node.js, REST API
4. Semantic layer fired: **Node.js ↔ JavaScript, 65.8% similar**, evidence
   `"Backend server development with JavaScript."` — shown as an AI-estimated
   suggestion, *not* added to the score.
5. spaCy layer fired: **Terraform** flagged as an AI-detected extra requirement
   in the JD — not counted.
6. Saved to history → **record #18**; verified it appears with matched/missing
   chips and the weighted-score formula.
7. Opened **My Profile**, edited college/degree/year/skills/bio, saved.
8. Changed password (current + new + confirm), logged out, logged back in with
   the new password.
9. Asked Ziva: *"I matched 45%... What are my top gaps and what should I learn
   first?"* — reply used the saved analysis (Node.js/REST API first, then
   Docker/AWS) and addressed the student by name.

## Recruiter flow

1. Registered a recruiter account in the UI.
2. Uploaded all three PDFs against the same JD.
3. Ranking was correct and exactly as expected:

| Rank | Candidate | Weighted | Simple | Matched | Missing |
|---|---|---|---|---|---|
| 1 | Kabir Mehta | 100% | 100% | 8 | 0 |
| 2 | Ananya Rao | 45% | 37.5% | 3 | 5 |
| 3 | Meera Joshi | 0% | 0% | 0 | 8 |

4. Saved the screening → **record #19**; verified it appears in recruiter
   history with the candidate table.
5. Role guard: opening `/student` as a recruiter showed
   **"This area is for students"** instead of the tool.

## Screenshots

`demo-run-2026-11-24/` — 29 images, `00_home` through `25_role_guard`:

- `04_results_top.png`, `04_results_full.png` — score, matched/missing evidence
- `05_semantic_section.png` — Node.js ↔ JavaScript 65.8%
- `06_spacy_section.png` — Terraform detection
- `09_history_details.png` — saved record #18
- `12_profile_saved.png` — profile edit
- `14_password_changed.png` — password change
- `15_relogin_new_password.png` — login with new password
- `16_ziva_reply.png` — context-aware Ziva reply
- `20_recruiter_results.png` — 100 / 45 / 0 ranking
- `24_history_recruiter_details.png` — saved screening #19
- `25_role_guard.png` — recruiter blocked from student area

## Notes / observations

- **Ziva upstream instability:** the configured default model
  (`gemini-3.1-flash-lite`) returned `503`/timeouts in earlier runs. This final
  run used a temporary environment override
  `GEMINI_MODEL=gemini-3.5-flash-lite` (no file change). A normal restart returns
  to `gemini-3.1-flash-lite`; change the default or add a fallback if needed.
- **Ziva UI fixed:** replies now render a safe markdown subset, the launcher is a
  single control, minimizing produces a compact summary bar instead of a white
  panel, and the header exposes only minimize and close.
- **Console:** no console errors, no page errors, and no failed requests in the
  final run. The favicon is served from `frontend/public/favicon.svg`.
- **Test data added:** users `demo.student.285425@example.com` (id 26) and
  `demo.recruiter.285425@example.com` (id 27), analyses #18–19. Remove before
  sharing the database if you want a clean history.

## Reproduce

Start both servers as described in `README.md`, then register fresh accounts and
use the job description and PDFs above. The shipped API checks are:

```powershell
cd backend
.\.venv\Scripts\python.exe audit_api_test.py
.\.venv\Scripts\python.exe verify_accuracy.py
```

The Playwright UI script used for this report lives in the local test workspace,
not in the project archive; it is not required to run the app.
