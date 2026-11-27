# Skill Gap Analyzer

**Evidence-first résumé screening for students and recruiters.**

A full-stack career tool that compares a résumé with a real job description, shows
the exact evidence behind every skill match, and separates verified scoring from
AI estimates and generated advice.

<p align="center">
  <img src="docs/home-desktop.png" alt="Skill Gap Analyzer landing page" width="88%" />
</p>

## What it does

| Student | Recruiter |
|---|---|
| Upload one résumé PDF and paste a job description | Upload up to 20 résumé PDFs against one role |
| Get a weighted and a simple coverage score | Get a ranked candidate table |
| See matched skills with the résumé line that proves them | See matched and missing skills per candidate |
| See missing skills ordered by importance | Review AI-estimated matches without changing scores |
| Follow a next-step learning roadmap | Save the screening to history |

Every result is explicitly split into three layers:

1. **Extracted** — résumé text, skills, sections, and contact details.
2. **Verified scoring** — literal keyword matches and the published formula.
3. **AI-generated or AI-estimated** — semantic suggestions, spaCy-detected terms,
   advice, and roadmaps. These are labelled and **never** added to the score.

## Highlights

- **Transparent scoring.** Both the weighted score and the simple coverage score
  are returned with their formulas and category weights.
- **Evidence for every match.** Each matched skill carries the exact résumé line
  where it was found.
- **Role-aware accounts.** Students and recruiters have separate workspaces,
  protected routes, profiles, and password management.
- **Saved history.** Logged-in users can revisit the full previous analysis, not
  just a score line.
- **Ziva, the career companion.** A Gemini-powered assistant that reads the
  student's latest saved report. It has a single launcher, a real minimized bar,
  starter prompts, safe markdown rendering, and a 15-message-per-minute limit.
- **Editorial interface.** A chalk-paper, forest, and marigold visual system with
  self-hosted Literata and Instrument Sans, a viewport-fitted app shell, and
  CSS/SVG-only 3D details.
- **Honest failure modes.** If spaCy, SentenceTransformers, or Gemini is missing,
  the app keeps working and says which layer is unavailable.

## Screens

<table>
  <tr>
    <td width="50%"><img src="docs/student-report.png" alt="Student report with score and evidence" /></td>
    <td width="50%"><img src="docs/ziva-open.png" alt="Ziva career companion open" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Student report: score, evidence, missing skills, roadmap</sub></td>
    <td align="center"><sub>Ziva: context-aware chat with a compact minimized state</sub></td>
  </tr>
</table>

<p align="center">
  <img src="docs/home-mobile.png" alt="Mobile landing page" width="30%" />
  &nbsp;&nbsp;
  <img src="docs/student-report-mobile.png" alt="Mobile student report" width="30%" />
</p>

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, React Router 7, Vite 6, Chart.js, hand-written CSS/SVG |
| Fonts | Literata Variable and Instrument Sans Variable, self-hosted via Fontsource |
| Backend | Flask 3, Flask-CORS, Flask-SQLAlchemy, PyMuPDF |
| Data | SQLite by default; MySQL via `DATABASE_URL` |
| Skill extraction | Curated dictionary (`backend/skills.json`) and regex matching |
| Optional NLP | spaCy `en_core_web_sm` for possible extra JD requirements |
| Optional semantics | SentenceTransformers `all-MiniLM-L6-v2` for meaning-based suggestions |
| Chat | Google Gemini REST API through a backend-only key |

## Architecture

```mermaid
flowchart LR
  B[Browser<br/>React + Vite] -->|session cookie<br/>JSON / FormData| A[Flask API]
  A --> PDF[PyMuPDF text extraction]
  A --> SK[Skill dictionary + matcher]
  A --> SP[spaCy optional]
  A --> ST[SentenceTransformers optional]
  A --> GM[Gemini optional]
  A --> DB[(SQLite or MySQL)]
  A --> UP[Uploaded PDFs on disk]
```

The frontend never holds the Gemini key, and the backend derives no score from
the LLM. Scoring stays in `backend/services/matcher.py`; AI output is a separate
response field for human review.

### The browser port (demo mode)

The scoring engine is duplicated in plain JavaScript under
`frontend/src/engine/`, so the demo needs no server:

```mermaid
flowchart LR
  B[Browser] --> P[pdf.js text extraction]
  P --> E[engine/analyze.js]
  E --> SK[engine/skillExtractor.js]
  E --> M[engine/matcher.js]
  E --> R[engine/resumeParser.js]
  E --> S[engine/suggester.js]
  SC[engine/skills.json] --> SK
```

| Backend module | Browser port | Behaviour |
|---|---|---|
| `services/skill_extractor.py` | `engine/skillExtractor.js` | Same dictionary, same whole-word boundaries |
| `services/matcher.py` | `engine/matcher.js` | Same two formulas and category weights |
| `services/resume_parser.py` | `engine/resumeParser.js` | Same heuristics and section headings |
| `services/suggester.py` | `engine/suggester.js` | Same tips, resources, and 3-phase roadmap |
| PyMuPDF | `pdfjs-dist` via `engine/pdfText.js` | Per-page text, worker bundled locally |

The port is **verified to produce identical results**. On the three sample
résumés in `demo_assets/`, the Python and JavaScript engines return the same
skills, the same matched/missing sets, and the same scores (for example 52.4%
weighted and 50.0% simple on `ananya_rao_resume.pdf`).

What deliberately does **not** run in the browser: semantic embedding matches,
spaCy JD terms, and Ziva. Those need a server, so demo mode returns them empty
with their honest explanatory notes rather than pretending they ran.

## Quick start

### Two ways to run this

| Mode | Needs a server? | What works |
|---|---|---|
| **Demo (frontend only)** | No | Résumé analysis, candidate screening, PDF parsing, every report — all in the browser |
| **Full app (frontend + backend)** | Yes | Everything above plus accounts, saved history, semantic AI matches, spaCy terms, and Ziva chat |

The public deployment at
<https://skill-gap-analyzer-bay-five.vercel.app> runs in **demo mode**. The
scoring engine is ported to JavaScript, so a résumé PDF is parsed and analysed
entirely in the visitor's browser — no upload, no server, nothing stored.

### Demo mode (no Python, no server)

```powershell
cd frontend
npm install
$env:VITE_DEMO_MODE="true"; npm run dev
```

Or build it for hosting:

```powershell
cd frontend
$env:VITE_DEMO_MODE="true"; npm run build
```

Deploy that `frontend` folder to Vercel (or any static host). `vercel.json`
already sets the build command, the output directory, and the SPA rewrites so
deep links such as `/student/results` work on refresh.

### Prerequisites for the full app

- Python **3.12**
- Node.js **20 LTS** (18+ should work)
- PowerShell on Windows; the commands below are PowerShell
- A free Gemini API key is optional, but required for Ziva

### 1. Backend

From the project root:

```powershell
cd backend

py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm

Copy-Item .env.example .env
# Open .env and paste your Gemini key after GEMINI_API_KEY=

.\.venv\Scripts\python.exe -c "from app import app; app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)"
```

The first run creates `backend/skill_analyzer.db` and `backend/uploads/`
automatically. Check the API at <http://127.0.0.1:5000/api/status>.

> `python app.py` also starts the server, but it enables Flask debug mode and the
> reloader. Prefer the explicit command above for development and demos.

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://127.0.0.1:5173>.

The API base URL is derived from the page's hostname at runtime
(`frontend/src/api.js`), always on port 5000. Open the app through the same host
you use for the API (`127.0.0.1` or `localhost`) so the session cookie stays
same-site.

### 3. Production build

```powershell
cd frontend
npm run build
npm run preview
```

The static build is written to `frontend/dist/`. Serve it with your preferred web
server and point it at the Flask API.

## Configuration

Settings live in `backend/config.py`; secrets belong in `backend/.env`.
Copy `.env.example` to `.env` and keep the real file out of version control.

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | empty | Enables Ziva. Without it, the chat reports that it is not configured. |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Gemini model name. Google retires model names periodically; change it if Ziva reports the model is unavailable. |
| `DATABASE_URL` | SQLite file | Any SQLAlchemy URL. Example for MySQL: `mysql+pymysql://root:password@localhost:3306/skill_analyzer` |

Optional layers are detected at runtime and reported by `GET /api/status`:

| Layer | If installed | If missing |
|---|---|---|
| spaCy | Possible extra JD requirements, labelled AI-detected | Hidden; keyword matching continues |
| SentenceTransformers | Possible meaning-based matches, labelled AI-estimated | Hidden; keyword matching continues |
| Gemini | Ziva replies in context | Ziva shows an honest configuration message |

The semantic model downloads once from Hugging Face (about 90 MB) on first use.
`requirements.txt` includes SentenceTransformers, which pulls in PyTorch; expect
a large first install.

## How scoring works

The job description and the résumé are scanned against the curated skill
dictionary. A required skill counts as **matched** only when its name is found in
the résumé text. Every match stores the line that proves it.

**Simple coverage**

```text
matched required skills / all required skills × 100
```

**Weighted skill score**

```text
sum of weights of matched skills / sum of weights of all required skills × 100
```

| Category | Weight |
|---|---:|
| Programming languages, web, databases, data/AI, mobile | 3 |
| Cloud/DevOps, CS fundamentals | 2 |
| Tools and soft skills | 1 |

Recruiters are ranked by weighted score, then by simple score, then by the number
of matched skills.

### What does not affect the score

- **Semantic possible matches.** A meaning-based suggestion such as
  Node.js ↔ JavaScript is shown only when the whole evidence line passes a 0.60
  cosine-similarity threshold. It is labelled "AI-estimated — needs human review."
- **spaCy-detected JD terms.** Terms outside the verified dictionary are shown as
  possible extra requirements.
- **Generated advice and roadmaps.** Rule-based suggestions are labelled
  AI-generated and are not facts extracted from the résumé.

## API overview

All routes return JSON. Session authentication uses a signed cookie.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/hello` | — | Health message |
| `GET` | `/api/status` | — | Reports optional AI layers and Ziva configuration |
| `POST` | `/api/upload-resume` | — | Upload one PDF and preview extracted skills |
| `POST` | `/api/analyze-resume` | Guest or student | Analyze one résumé against a job description |
| `POST` | `/api/screen-candidates` | Guest or recruiter | Rank up to 20 résumés against one job |
| `POST` | `/api/register` | — | Create a student or recruiter account |
| `POST` | `/api/login` | — | Start a session |
| `POST` | `/api/logout` | — | Clear the session |
| `GET` | `/api/me` | — | Return the current user or `null` |
| `GET` | `/api/profile` | Logged in | Read the current profile |
| `PUT` | `/api/profile` | Logged in | Update role-appropriate profile fields |
| `POST` | `/api/account/password` | Logged in | Change password after verifying the current one |
| `POST` | `/api/ziva/chat` | Logged in | Send a message to Ziva (15/minute) |
| `POST` | `/api/save-analysis` | Logged in | Save a student or recruiter result |
| `GET` | `/api/my-analyses` | Logged in | Return up to 50 saved analyses |

Uploads are PDF-only, limited to 20 MB per request, with a 20,000-character job
description limit. The backend also enforces role guards; the frontend's
`ProtectedRoute` is a usability layer, not the security boundary.

## Project structure

```text
Skill-Gap-Analyzer/
├── backend/
│   ├── app.py                  Flask routes and request validation
│   ├── config.py               Settings, database URL, AI configuration
│   ├── models.py               User and Analysis tables
│   ├── skills.json             Curated skill dictionary
│   ├── database_schema.sql     Reference schema and MySQL notes
│   ├── services/
│   │   ├── resume_parser.py    Contact details and section detection
│   │   ├── skill_extractor.py  Dictionary and regex skill extraction
│   │   ├── matcher.py          Transparent weighted/simple scoring
│   │   ├── semantic_matcher.py Optional meaning-based suggestions
│   │   ├── nlp_analyzer.py     Optional spaCy JD term detection
│   │   ├── suggester.py        Advice and learning roadmap
│   │   └── ziva_ai.py          Gemini prompt and context assembly
│   ├── audit_api_test.py       43 API/auth/role/upload checks
│   └── verify_accuracy.py      Extraction, scoring, and ranking checks
├── frontend/
│   ├── src/
│   │   ├── components/         Shell, 3D scenes, charts, Ziva, guards
│   │   ├── pages/              Home, auth, dashboards, results, history, profile
│   │   ├── engine/             Browser port of the scoring engine (demo mode)
│   │   │   ├── analyze.js          Orchestrator; mirrors the Flask responses
│   │   │   ├── skillExtractor.js   Dictionary and whole-word matching
│   │   │   ├── matcher.js          Weighted and simple scores
│   │   │   ├── resumeParser.js     Contact details and sections
│   │   │   ├── suggester.js        Advice and learning roadmap
│   │   │   ├── pdfText.js          pdf.js text extraction
│   │   │   └── skills.json         Copy of the curated dictionary
│   │   ├── api.js              Single API client (routes to engine in demo)
│   │   ├── config.js           Demo-mode switches and upload limits
│   │   └── index.css           Design system and all layout
│   ├── vercel.json             Build, output directory, SPA rewrites
│   └── package.json
├── demo_assets/                Three sample résumés for a demo screening
├── demo-run-2026-11-24/        Verified end-to-end run and screenshots
├── docs/                       README screenshots
├── RUN.md                      Condensed run notes
└── README.md
```

Runtime files intentionally excluded from version control: `backend/.env`,
`backend/skill_analyzer.db`, `backend/uploads/`, `frontend/node_modules/`, and
`frontend/dist/`.

## Testing

With the backend running on port 5000:

```powershell
cd backend
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

# API, auth, roles, uploads, Ziva, and rate limiting
.\.venv\Scripts\python.exe audit_api_test.py

# Ground-truth skill extraction, scoring, and ranking
.\.venv\Scripts\python.exe verify_accuracy.py
```

Build check for the frontend:

```powershell
cd frontend
npm run build
```

## Demo walkthrough

`demo_assets/` contains three fictional résumés. Use this job description:

> Requirements: Python, React, MySQL, Node.js, Docker, Terraform, and strong
> problem solving. You will build REST APIs and work with relational databases.
> Nice to have: AWS.

Register a student account, upload `ananya_rao_resume.pdf`, set the title to
**Full Stack Developer Intern**, and analyze. The expected result is **45%
weighted / 37.5% simple**, with MySQL, Python, and React matched, and AWS, Docker,
Problem Solving, Node.js, and REST API missing. The semantic layer should suggest
Node.js ↔ JavaScript at roughly 65.8% similarity.

For the recruiter flow, register a recruiter account and screen all three PDFs
against the same job description. The expected order is **Kabir Mehta 100%**,
**Ananya Rao 45%**, **Meera Joshi 0%**.

Scores can move slightly as the skill dictionary or optional AI models change;
the demo run in `demo-run-2026-11-24/REPORT.md` records the exact verified
output.

## Design notes

- **Editorial, not dashboard-default.** Chalk-paper surfaces, forest ink, marigold
  accents, a report-like rail, and restrained rules replace generic card grids and
  blue/purple gradients.
- **One screen per page.** The app shell is a fixed header, flexible main area,
  and compact footer. Long reports, forms, and history scroll inside dedicated
  panes instead of moving the whole document.
- **CSS/SVG 3D.** The landing hero, auth orbit, growth chart, and report rail are
  composed from CSS transforms and SVG. Animations move only the `translate`
  property so rotations stay static and the result stays smooth without WebGL.
- **Accessible by default.** Keyboard focus states, a skip link, labelled icon
  buttons, live chat log, reduced-motion handling, and text alternatives for
  decorative scenes.
- **Mobile aware.** The shell, reports, and Ziva switch to single-column and
  full-screen layouts below 900 px and 640 px.
- **Ziva has three honest states.** Closed shows one launcher; open shows a
  conversation with a two-button header; minimized becomes a compact summary bar
  with an expand control, never an empty white panel.

## Security notes

This is an educational project, not a production-hardened service. Before any
real deployment:

- Replace the hardcoded `SECRET_KEY` in `backend/config.py` with a strong secret
  loaded from the environment.
- Restrict CORS to the real frontend origin. The current configuration reflects
  origins and allows credentials.
- Run behind HTTPS and set secure, HTTP-only, same-site cookies.
- Disable Flask debug mode and the reloader.
- Add login rate limiting, CSRF protection, security headers, and session
  revocation.
- Store uploaded résumés in private object storage, add retention limits, and
  scan uploads.
- Review the SQLite/MySQL deployment choice and database backups.
- Treat résumés as personal data: the repository does not ship the development
  database or the `backend/uploads/` folder.

Ziva sends only the user's name, target role, score, and matched/missing skill
names to Gemini. Résumé text is not sent. The key stays on the server.

## Limitations

- PDF text extraction only; scanned/image-only PDFs need OCR, which is not built in.
- Skill matching depends on a finite dictionary; synonyms outside it can be missed.
- Semantic suggestions are deliberately conservative and are not proof of a skill.
- Ziva needs a live Gemini key and network access; quota errors appear in the chat.
- The UI is optimized for modern evergreen browsers.

In demo mode specifically:

- Accounts, saved history, profiles, and settings are disabled by design.
- Semantic matches, spaCy-detected JD terms, and Ziva are unavailable; those
  panels are omitted rather than filled with invented output.
- Résumés are parsed in the browser and never uploaded, so nothing is stored —
  but a very large PDF takes a moment longer to read on a slow phone.

## Credits

- Typefaces: [Literata](https://fonts.google.com/specimen/Literata) and
  [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans), served by
  [Fontsource](https://fontsource.org/).
- Icons: hand-drawn SVG paths in `frontend/src/components/Icons.jsx`.
- Sample résumés and all demo people are fictional.

---

For the shortest path from clone to running app, see [`RUN.md`](RUN.md).
