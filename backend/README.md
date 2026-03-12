# ⚙️ **Hintify Backend**

### *Express REST API powering AI hint generation, PDF parsing, and student activity logging*

<div align="center">
<img src="https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge">
<img src="https://img.shields.io/badge/Framework-Express%204-000000?style=for-the-badge">
<img src="https://img.shields.io/badge/Language-TypeScript%205.5-3178C6?style=for-the-badge">
<img src="https://img.shields.io/badge/AI-Anthropic%20Claude-8A2BE2?style=for-the-badge">
<img src="https://img.shields.io/badge/Database-PostgreSQL%2015-336791?style=for-the-badge">
</div>

---

# 📌 **Overview**

**Hintify Backend** is a TypeScript Express API that handles everything server-side for the Hintify tutoring platform — PDF ingestion, question storage, AI-powered hint generation, and hint event logging.

It uses:

* **Express 4 + TypeScript** — typed, structured REST API with controller/service/route separation
* **pdf-parse** — extracts and heuristically parses question blocks from teacher-uploaded PDFs
* **Anthropic Claude** — generates level-aware hints and full solutions on demand, cached to avoid redundant API calls
* **PostgreSQL (`msme_pg`)** — logs every hint request (question, level, user, generated text) for analytics and audit
* **questions.json** — lightweight file-based question store; fast for small-to-medium document sets

> Designed to be simple, readable, and easy to extend — swap the JSON store for Postgres tables whenever scale demands it.

---

# 🧠 **Architecture**

```
HTTP Request (Frontend / API Client)
             ↓
┌────────────────────────────────────┐
│         Express App (:3001)        │
│                                    │
│  /api/questions  →  questions.routes│
│  /api/hints      →  hints.routes   │
│  /api/health     →  inline handler │
└────────┬───────────────┬───────────┘
         ↓               ↓
  questions.controller  hints.controller
         ↓               ↓
  pdfParser.service   questionStore.service
         ↓               ↓
   pdf-parse lib     questions.json
                         ↓
                  claude.service (Anthropic)
                         ↓
                  hintLog.service
                         ↓
               PostgreSQL — hints_log table
```

---

# 🚀 **Features**

### 📄 PDF Upload & Question Parsing
Teachers POST a PDF file to `/api/questions/upload`. The backend extracts raw text with `pdf-parse`, splits it into numbered question blocks, detects multiple-choice options (A/B/C/D), and writes structured question objects to `questions.json` — each with a unique auto-incrementing ID.

### 💡 AI Hint Generation with Caching
Students POST to `/api/hints` with a question ID and hint level (1, 2, or 3). If the hint already exists in `questions.json`, it is returned instantly. If not, Claude is called with a level-specific prompt, the response is saved back to `questions.json`, and the event is logged to Postgres — so the same hint is never generated twice.

### 🗄️ PostgreSQL Hint Logging
Every hint request (question ID, level, user ID, generated text, timestamp) is inserted into the `hints_log` table in the `msme_pg` Postgres container. This gives teachers and admins a full audit trail and raw data for analytics.

### 🗂️ Question Store Service
`questionStore.service.ts` provides a clean async interface — `readAll`, `writeAll`, `getById`, `updateById`, `addMany` — over the `questions.json` file. Switching to a Postgres-backed store later only requires replacing this one service.

### 🐳 Docker Postgres Setup
`infra/docker-compose.yml` spins up a Postgres 15 container named `msme_pg` with a mounted `init.sql` that creates the `hintify_AI_qa_web` database, the `app_owner` role, and the `hints_log` table automatically on first start.

---

# ⚙️ **Tech Stack**

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | Express 4.18 |
| Language | TypeScript 5.5 |
| AI / LLM | Anthropic Claude REST API |
| PDF Parsing | pdf-parse 1.1.1 |
| Database | PostgreSQL 15 (Docker) |
| DB Client | node-postgres (pg 8.10) |
| File Upload | multer (memory storage) |
| HTTP Client | axios 1.5 |
| Dev Server | ts-node-dev |
| Infra | Docker + docker-compose |

---

# 📦 **Setup**

1. **Navigate to the backend directory:**

```bash
cd backend
```

2. **Copy and configure environment variables:**

```bash
cp .env.example .env
# Open .env and fill in ANTHROPIC_API_KEY and DB credentials
```

3. **Start the Postgres container:**

```bash
cd ../infra
docker-compose up -d
```

4. **Install dependencies:**

```bash
cd ../backend
npm install
```

5. **Start the development server:**

```bash
npm run dev
# API is now running at http://localhost:3001
```

---

# 🛡️ **Production Tips**

* Move `ANTHROPIC_API_KEY` and DB credentials to a secrets manager (AWS Secrets Manager, Doppler, Vault) — never commit them
* Replace `questions.json` with a Postgres `questions` table for transactional safety, concurrent writes, and easier querying
* Add JWT middleware to all routes before any public deployment — currently all endpoints are open
* Sanitize user input and question text before passing to Claude to prevent prompt injection
* Run the API in a Docker container behind an nginx reverse proxy with TLS in production

---

# 🔌 **API Endpoints**

### Questions

```
POST /api/questions/upload   — Upload PDF (multipart/form-data, field: "pdf"); returns parsed question array
GET  /api/questions          — List all questions stored in questions.json
```

### Hints

```
POST /api/hints              — Request a hint
                               Body: { "questionId": 5, "level": 1, "userId": 123 }
                               level 1 = first hint, 2 = second hint, 3 = full solution
                               Returns: { "text": "...", "fromCache": true | false }
```

### Health

```
GET  /api/health             — Returns { "ok": true } for uptime / load balancer checks
```

---

# 💡 **Roadmap**

* [ ] JWT authentication and role-based route guards (teacher vs student)
* [ ] Migrate question storage from `questions.json` to a Postgres `questions` table
* [ ] Improve PDF parser with layout-aware OCR for complex multi-column documents
* [ ] Teacher endpoint to review, edit, or delete parsed questions before publishing
* [ ] Paginated question listing with subject and keyword filtering
* [ ] Rate limiting on `/api/hints` to control Anthropic API spend per user

---

# 🔒 **Security Notes**

* `ANTHROPIC_API_KEY` must never be committed — keep it in `.env` (already in `.gitignore`)
* All API routes are currently unprotected — add JWT middleware before any public-facing deployment
* The PDF parser is intentionally naive; validate and sanitize parsed output before storing or forwarding to Claude
* `questions.json` is written directly by the server process — ensure the file path is outside the web root in production
* Use parameterized queries only (already done in `hintLog.service.ts`) — never interpolate user input into SQL strings

---

# 📁 **Folder Structure**

```
backend/
│
├── src/
│   ├── config/
│   │   └── db.ts               # PostgreSQL pool setup (node-postgres)
│   │
│   ├── controllers/
│   │   ├── hints.controller.ts     # POST /api/hints — generate or return cached hint
│   │   └── questions.controller.ts # POST /api/questions/upload, GET /api/questions
│   │
│   ├── routes/
│   │   ├── hints.routes.ts         # Express router for /api/hints
│   │   └── questions.routes.ts     # Express router for /api/questions (+ multer)
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   └── claude.service.ts   # Anthropic REST wrapper — generateHint(text, level)
│   │   ├── hintLog.service.ts      # INSERT into hints_log (Postgres)
│   │   ├── pdfParser.service.ts    # pdf-parse + question block extraction
│   │   └── questionStore.service.ts# Read/write questions.json (CRUD interface)
│   │
│   ├── types/
│   │   └── index.ts            # Question type definition
│   │
│   ├── app.ts                  # Express app wiring (cors, body-parser, routers)
│   └── index.ts                # Server entry point (dotenv + listen)
│
├── data/
│   └── questions.json          # Runtime question store (auto-created if missing)
│
├── pdf-question-parser/        # Standalone PDF-to-JSON utility (separate tsconfig)
│
├── .env.example                # Environment variable template
├── package.json
└── tsconfig.json
```

---

# 🤝 **Contributing**

PRs and issues are welcome. Fork freely and build on top of this.

---

# 📜 **License**

MIT License — use freely.

---

# ❤️ **Credits**

* Anthropic Claude — AI hint and solution generation
* pdf-parse — PDF text extraction
* node-postgres — PostgreSQL client for hint logging
* multer — multipart file upload handling for PDF ingestion
* ts-node-dev — fast TypeScript dev server with hot reload

---

# 🚀 Made with passion by **Akhil**

> *The brain behind Hintify — serving smarter hints, one Claude call at a time.*
