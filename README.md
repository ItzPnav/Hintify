# 🎓 **Hintify**

### *AI-powered progressive hint system connecting teachers, students, and documents*

<div align="center">
<img src="https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge">
<img src="https://img.shields.io/badge/Backend-Node%20%2F%20Express-339933?style=for-the-badge">
<img src="https://img.shields.io/badge/AI-Claude%20(Anthropic)-8A2BE2?style=for-the-badge">
<img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge">
<img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge">
</div>

---

# 📌 **Overview**

**Hintify** is a full-stack intelligent tutoring web app where teachers upload PDF question sets and students interact with an AI chatbot that delivers progressive hints — first hint, second hint, then full solution — without just giving away answers.

It uses:

* **React 18 + TypeScript** — type-safe, role-based UI for teachers and students
* **Node.js + Express** — REST API handling PDF uploads, question storage, and hint routing
* **Anthropic Claude** — generates contextual, level-aware hints and solutions on demand
* **PostgreSQL (`msme_pg`)** — logs every hint request for teacher analytics and audit
* **Tailwind CSS** — warm, responsive design with full light/dark mode support

> Built as an educational demo with a clean architecture that is ready for backend integration and production hardening.

---

# 🧠 **Architecture**

```
Teacher (Browser)              Student (Browser)
      |                               |
      | Upload PDF                    | Ask for hint
      ↓                               ↓
┌──────────────────────────────────────────────────┐
│              Express REST API  (:3001)            │
│                                                  │
│  POST /api/questions/upload  → pdfParser.service │
│  GET  /api/questions         → questionStore     │
│  POST /api/hints             → hints.controller  │
└────────────┬───────────────────────┬─────────────┘
             ↓                       ↓
  ┌──────────────────┐    ┌───────────────────────┐
  │  questions.json  │    │  Anthropic Claude API  │
  │  (question store)│    │  (hint1/hint2/solution)│
  └──────────────────┘    └───────────────────────┘
                                    ↓
                       ┌────────────────────────┐
                       │  PostgreSQL (msme_pg)   │
                       │  hints_log table        │
                       └────────────────────────┘
```

---

# 🚀 **Features**

### 👩‍🏫 Dual Role System
Separate dashboards for teachers and students. Teachers upload PDFs and view analytics. Students chat with the AI tutor. Role is selected at login and persists across sessions.

### 💡 Progressive Hint Engine
Students receive up to three levels of help per question — a gentle first hint, a stronger second hint, and finally the full solution. Claude generates each level on demand and caches results in `questions.json` for instant future retrieval.

### 📊 Student Analytics
Teachers see a real-time table of which students used which hints on which questions. Color-coded badges (green = used, red = not used) make it easy to spot who is struggling at a glance.

### 📄 PDF Upload & Parsing
Teachers drag-and-drop a PDF question set. The backend parses it into structured question objects, stores them in `questions.json`, and makes them immediately available to the AI hint engine.

### 🌗 Theme Support
Full light and dark mode throughout every screen — login, dashboards, chat, and document viewer — toggled from the header with instant persistence.

### 💾 Session Persistence
User sessions, uploaded documents, and hint history are preserved in `localStorage` across browser refreshes. Optional "Remember Me" keeps the session active for 2 hours.

---

# ⚙️ **Tech Stack**

| Layer | Technology |
|-------|------------|
| Frontend UI | React 18.3.1 + TypeScript 5.5 |
| Build Tool | Vite 7.2 |
| Styling | Tailwind CSS 3.4 + PostCSS |
| Icons | Lucide React |
| Backend | Node.js + Express 4 |
| AI / LLM | Anthropic Claude (via REST API) |
| PDF Parsing | pdf-parse |
| Database | PostgreSQL 15 (Docker: `msme_pg`) |
| DB Client | node-postgres (pg) |
| Dev Runtime | ts-node-dev |

---

# 📦 **Setup**

1. **Clone the repo:**

```bash
git clone https://github.com/[USERNAME]/Hintify.git
cd Hintify
```

2. **Start the Postgres container:**

```bash
cd infra
docker-compose up -d
```

3. **Install and configure the backend:**

```bash
cd ../backend
cp .env.example .env
# Open .env and set ANTHROPIC_API_KEY, DB credentials, etc.
npm install
npm run dev
```

4. **Install and start the frontend:**

```bash
cd ../frontend
npm install
npm run dev
```

5. **Open the app:**

```bash
# Frontend runs at:
http://localhost:5173

# Backend API runs at:
http://localhost:3001
```

---

# 🛡️ **Production Tips**

* Store `ANTHROPIC_API_KEY` and DB passwords in a secrets manager (e.g. AWS Secrets Manager, Doppler) — never commit them to source control
* Replace `questions.json` file storage with a Postgres table for concurrency safety and transactional integrity
* Add JWT-based authentication with bcrypt password hashing before any public deployment — the current mock auth is demo-only
* Put the Express API behind a reverse proxy (nginx) with TLS termination and enable CORS restrictions to your frontend domain only
* Sanitize and validate all user inputs before passing content to the Claude API to prevent prompt injection

---

# 🔌 **API Endpoints**

### Questions

```
POST /api/questions/upload   — Upload a PDF; parses and stores questions
GET  /api/questions          — List all stored questions
```

### Hints

```
POST /api/hints              — Request a hint (body: { questionId, level, userId })
                               Returns cached hint if exists, else calls Claude and saves
```

### Health

```
GET  /api/health             — Returns { ok: true } for uptime checks
```

---

# 💡 **Roadmap**

* [ ] JWT authentication with role-based route protection
* [ ] Move question storage from JSON file to Postgres table
* [ ] Real PDF rendering in the student document viewer (pdfjs-dist)
* [ ] Export student analytics as CSV or PDF report
* [ ] Teacher manual review/edit of AI-parsed questions before publishing
* [ ] Real-time notifications when a student requests a hint
* [ ] Question bank — teachers create questions manually, not just via PDF

---

# 🔒 **Security Notes**

* Passwords are currently stored in plaintext in `localStorage` — this is a demo only and **not production ready**
* No backend authentication exists yet — all API routes are open; add JWT middleware before deployment
* Client-side validation only — add input sanitization and validation on the Express layer
* Never commit `.env` files — use `.env.example` as the committed reference template
* The Claude prompt uses raw question text — sanitize input to prevent prompt injection attacks

---

# 📁 **Folder Structure**

```
Hintify/
│
├── frontend/               # React + TypeScript SPA (Vite)
│   └── src/
│       ├── components/     # Auth, Dashboard, Layout, UI components
│       ├── contexts/       # AppContext — global state and persistence
│       ├── services/       # aiService, pdfService (frontend stubs)
│       └── types/          # TypeScript interfaces
│
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── controllers/    # hints.controller, questions.controller
│   │   ├── routes/         # Express routers
│   │   ├── services/       # claude.service, pdfParser, questionStore, hintLog
│   │   ├── config/         # db.ts (PostgreSQL pool)
│   │   └── types/          # Shared TypeScript types
│   ├── data/               # questions.json (runtime question store)
│   └── pdf-question-parser/# Standalone PDF-to-JSON utility
│
├── infra/                  # Infrastructure config
│   ├── docker-compose.yml  # Starts msme_pg (Postgres 15)
│   └── init.sql            # Creates DB, user, and hints_log table
│
├── FRONTEND_DOCUMENTATION.md
├── BACKEND_EXPLAINED.md
└── README.md
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
* pdf-parse — PDF text extraction on the backend
* Lucide React — icon library used throughout the UI
* Tailwind CSS — utility-first styling with dark mode support
* node-postgres — PostgreSQL client for hint logging

---

# 🚀 Made with passion by **Akhil**

> *Hintify helps students think before they look — one hint at a time.*
