# Running the project (Windows / PowerShell)

Two processes: a Flask API on port **5000** and a Vite/React dev server on port **5173**.

## 1. Backend

```powershell
cd backend

# one-time setup (Python 3.12)
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm

# run
.\.venv\Scripts\python.exe -c "from app import app; app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)"
```

`python app.py` also works, but it enables the debug reloader and spawns a child process;
the explicit command above keeps a single process and is easier to stop.

- Status check: <http://127.0.0.1:5000/api/status>
- Database: SQLite file `backend/skill_analyzer.db` (created automatically).
- Config: `backend/config.py` + `backend/.env` (contains `GEMINI_API_KEY`; do not commit/share).

## 2. Frontend

```powershell
cd frontend
npm install     # one-time
npm run dev
```

Open <http://127.0.0.1:5173>.

The API base URL is derived at runtime from `window.location.hostname` + port 5000
(`src/api.js`), so cookies stay same-site.

## 3. Tests

With the backend running:

```powershell
cd backend
$env:PYTHONIOENCODING = "utf-8"; $env:PYTHONUTF8 = "1"

# API / auth / roles / uploads / Ziva / rate limits — 43 checks
.\.venv\Scripts\python.exe audit_api_test.py

# Ground-truth skill extraction, scoring and ranking accuracy
.\.venv\Scripts\python.exe verify_accuracy.py
```

## Optional AI layers

| Layer | Package | Effect when missing |
|---|---|---|
| spaCy NER | `spacy` + `en_core_web_sm` | AI-detected extra JD terms hidden |
| SentenceTransformers | `sentence-transformers` (PyTorch) | "Possible matches by meaning" hidden |
| Ziva chat | `GEMINI_API_KEY` in `.env` | Chat replies with a configuration error |

First semantic analysis downloads `all-MiniLM-L6-v2` (~90 MB) from Hugging Face.
`GET /api/status` reports which layers are active.

## Notes / known issues

- **Semantic matching is conservative by design.** It only surfaces a pair when a
  missing JD skill and a resume skill's *whole evidence line* score ≥ 60 % cosine
  similarity. Because the evidence line always repeats the resume skill's name,
  most realistic pairs land below the threshold, so the section rarely appears.
  It never changes the score.
- The favicon is served from `frontend/public/favicon.svg`.
- Ziva depends on the live Gemini API — transient `503`/quota errors are surfaced
  honestly in the chat UI.
- Uploaded résumés are stored in `backend/uploads/` at runtime. The shared project
  archive excludes that folder, the development database, and `backend/.env`.
- The original archive's bundled `venv/` is not portable and should be ignored;
  this project uses the `backend/.venv` created above.
