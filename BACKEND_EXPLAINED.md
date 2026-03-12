Nice — I’ll generate the **full backend project** (TypeScript + Node/Express) that implements the question-JSON approach you decided on, plus a minimal infra docker compose to run only the Postgres container named `msme_pg`.

What you’ll get in this message:

* Project folder tree (exact paths)
* Every important file content (copy/paste-ready)
* `infra/docker-compose.yml` that starts `msme_pg`
* SQL init file to create DB/user & a `hints` table (so you can log hint requests)
* Run instructions

I kept the design **simple, robust, and ready to extend**:

* Questions are stored in `backend/data/questions.json`
* Teachers upload PDFs → `POST /api/questions/upload` (parses PDF to naive question JSON; you’ll improve the parser later)
* Students request hints → `POST /api/hints` with `{ questionId, level }`

  * If `hint1` / `hint2` / `solution` are empty, backend calls Claude (Anthropic) and saves the output into `questions.json`
  * The backend also logs each hint request into Postgres (`msme_pg`) `hints_log` table
* No embeddings / reranker at all

---

# Project tree (exact)

```
hintify/
├── 📁 backend
│   ├── 📁 ${DATA_DIR}
│   │   └── ⚙️ questions.json
│   ├── 📁 pdf-question-parser
│   │   ├── 📁 src
│   │   │   └── 📄 pdf-to-questions.ts
│   │   ├── ⚙️ package-lock.json
│   │   ├── ⚙️ package.json
│   │   └── ⚙️ tsconfig.json
│   ├── 📁 src
│   │   ├── 📁 config
│   │   │   └── 📄 db.ts
│   │   ├── 📁 controllers
│   │   │   ├── 📄 hints.controller.ts
│   │   │   └── 📄 questions.controller.ts
│   │   ├── 📁 routes
│   │   │   ├── 📄 hints.routes.ts
│   │   │   └── 📄 questions.routes.ts
│   │   ├── 📁 services
│   │   │   ├── 📁 ai
│   │   │   │   └── 📄 claude.service.ts
│   │   │   ├── 📄 hintLog.service.ts
│   │   │   ├── 📄 pdfParser.service.ts
│   │   │   └── 📄 questionStore.service.ts
│   │   ├── 📁 types
│   │   │   └── 📄 index.ts
│   │   ├── 📄 app.ts
│   │   └── 📄 index.ts
│   ├── ⚙️ .env.example
│   ├── ⚙️ .gitignore
│   ├── 📝 README.md
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   └── ⚙️ tsconfig.json
```

---

# 1) `backend/.env.example` (copy to `.env` and fill values)

```bash
# Server
PORT=3001
NODE_ENV=development

# Postgres (msme_pg)
DB_HOST=localhost
DB_PORT=5432
DB_USER=app_owner
DB_PASSWORD=ChangeMe123!
DB_NAME=hintify_AI_qa_web

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# RAG / parsing config (used by pdf parser when chunking; adjust later)
CHUNK_SIZE=1200
CHUNK_OVERLAP=150

# Data dir
DATA_DIR=./data
QUESTIONS_FILE=${DATA_DIR}/questions.json
```

---

# 2) `infra/docker-compose.yml` (starts only Postgres container `msme_pg`)

```yaml
version: "3.8"
services:
  msme_pg:
    image: postgres:15
    container_name: msme_pg
    environment:
      POSTGRES_PASSWORD: ChangeMe123!
      POSTGRES_USER: postgres
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/infra/init.sql:/docker-entrypoint-initdb.d/init.sql:ro

volumes:
  pgdata:
```

> Notes:
>
> * The `init.sql` file (below) will be mounted and executed at container initialization to create the application DB and user we expect.

---

# 3) `backend/infra/init.sql` (runs on container first start)

```sql
-- Create the app database and owner if not exists
-- NOTE: This script is executed as the default postgres user

-- create DB
CREATE DATABASE hintify_AI_qa_web;

-- create user (app_owner) with password
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_owner') THEN
      CREATE ROLE app_owner WITH LOGIN PASSWORD 'ChangeMe123!';
   END IF;
END
$$;

-- grant privileges
GRANT ALL PRIVILEGES ON DATABASE hintify_AI_qa_web TO app_owner;

-- Connect to the app DB and create a simple hints log table
\connect hintify_AI_qa_web;

CREATE TABLE IF NOT EXISTS hints_log (
  id SERIAL PRIMARY KEY,
  question_id INTEGER,
  hint_level INTEGER,
  user_id INTEGER NULL,
  generated_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 4) `backend/data/questions.json` (starter file)

```json
{
  "questions": []
}
```

(Initially empty — teacher uploads will populate it. You can also paste pre-extracted JSONs here.)

---

# 5) `backend/package.json`

```json
{
  "name": "hintify-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "pdf-parse": "^1.1.1",
    "pg": "^8.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.19",
    "@types/node": "^20.4.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.3"
  }
}
```

---

# 6) `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

---

# 7) Types (helpful type)

`backend/src/types/index.ts`

```ts
export type Question = {
  id: number;
  subject?: string;
  questionText: string;
  options?: string[];
  answer?: string;       // teacher answer (if any)
  hint1?: string;
  hint2?: string;
  solution?: string;
};
```

---

# 8) DB config

`backend/src/config/db.ts`

```ts
import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.warn("Database env not fully set; DB operations may fail.");
}

const pool = new Pool({
  host: DB_HOST || "localhost",
  port: Number(DB_PORT || 5432),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool
};
```

---

# 9) Claude service (Anthropic) — minimal

`backend/src/services/ai/claude.service.ts`

```ts
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-1";

if (!API_KEY) {
  console.warn("ANTHROPIC_API_KEY not set. Claude requests will fail.");
}

/**
 * simple wrapper to request a completion from Anthropic/Claude
 * Uses the /v1/complete endpoint for compatibility. If your infra uses Anthropic SDK, swap accordingly.
 */
export default {
  async generateHint(questionText: string, level: number) {
    if (!API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

    const prompt =
      level === 1
        ? `Give a short beginner-level hint (do NOT reveal the answer). Question:\n${questionText}\nHint:`
        : level === 2
        ? `Give a stronger hint (still do NOT reveal the final answer). Question:\n${questionText}\nHint:`
        : `Provide the final answer and a clear explanation/solution. Question:\n${questionText}\nSolution:`;

    // Anthropic standard complete endpoint — adjust headers if your account needs alternative auth
    const url = "https://api.anthropic.com/v1/complete";
    const payload = {
      model: MODEL,
      prompt,
      // we keep the generation short for hints; allow longer for solutions
      max_tokens: level === 3 ? 800 : 200,
      temperature: 0.2
    };

    const res = await axios.post(url, payload, {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      }
    });

    // Response shape may vary; handle expected fields
    const text =
      res.data?.completion ||
      res.data?.completion?.text ||
      res.data?.completion?.output ||
      res.data?.result ||
      res.data?.output?.[0]?.content?.[0]?.text ||
      "";

    // fallback to common location
    if (!text && res.data?.completion) return String(res.data.completion);
    return String(text).trim();
  }
};
```

> If your Anthropic account requires a different endpoint or SDK, replace this small wrapper with `@anthropic-ai/sdk` call. This wrapper tries a typical endpoint structure.

---

# 10) Question store (read/write JSON)

`backend/src/services/questionStore.service.ts`

```ts
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { Question } from "../types";

const QUESTIONS_FILE = process.env.QUESTIONS_FILE || path.join(__dirname, "..", "..", "data", "questions.json");

export default {
  async readAll(): Promise<Question[]> {
    try {
      const raw = await fs.readFile(QUESTIONS_FILE, "utf8");
      const data = JSON.parse(raw);
      return data.questions || [];
    } catch (err: any) {
      if (err.code === "ENOENT") {
        await fs.mkdir(path.dirname(QUESTIONS_FILE), { recursive: true });
        await fs.writeFile(QUESTIONS_FILE, JSON.stringify({ questions: [] }, null, 2), "utf8");
        return [];
      }
      throw err;
    }
  },

  async writeAll(questions: Question[]) {
    const payload = { questions };
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(payload, null, 2), "utf8");
  },

  async getById(id: number) {
    const qs = await this.readAll();
    return qs.find((q) => q.id === id);
  },

  async updateById(id: number, patch: Partial<Question>) {
    const qs = await this.readAll();
    const idx = qs.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    qs[idx] = { ...qs[idx], ...patch };
    await this.writeAll(qs);
    return qs[idx];
  },

  async addMany(questions: Question[]) {
    const qs = await this.readAll();
    // ensure unique ids: set ids sequentially if missing
    const maxId = qs.reduce((m, q) => Math.max(m, q.id || 0), 0);
    let nextId = maxId + 1;
    const added = questions.map((q) => ({ id: q.id || nextId++, ...q }));
    const merged = [...qs, ...added];
    await this.writeAll(merged);
    return added;
  }
};
```

---

# 11) PDF parser (very simple; extracts Q/A blocks heuristically)

`backend/src/services/pdfParser.service.ts`

```ts
import pdfParse from "pdf-parse";

/**
 * Very simple parser to extract question blocks from a PDF buffer.
 * This is intentionally naive: it splits text by numbers followed by a dot/newline (e.g., "1." "2.") and captures following option lines (A, B, C, D)
 * In production you will replace this with a robust OCR+layout parser or manual CSV upload.
 */
export default {
  async parsePdfBuffer(buffer: Buffer) {
    const data = await pdfParse(buffer);
    const text = data.text || "";
    // Normalize newlines
    const cleaned = text.replace(/\r/g, "\n").replace(/\n{2,}/g, "\n\n");

    // split by question numbers like "1." at line starts
    const questionBlocks = cleaned.split(/\n(?=\d+\.)/g); // keep the leading number on each block
    const parsed: any[] = [];

    for (const block of questionBlocks) {
      const m = block.match(/^\s*(\d+)\.\s*([\s\S]+)/);
      if (!m) continue;
      const qnum = Number(m[1]);
      const rest = m[2].trim();

      // attempt to find options A, B, C, D
      const optionsMatch = rest.split(/\n(?=[A-D]\s*[).-])/);
      let questionText = optionsMatch.shift() || "";
      const options = optionsMatch.map((o) => o.replace(/^[A-D]\s*[).-\s]*/i, "").trim());

      parsed.push({
        id: qnum,
        questionText: questionText.trim(),
        options
      });
    }

    return parsed;
  }
};
```

> NOTE: This is intentionally naive. For robust parsing, consider using layout-aware OCR or manual teacher input.

---

# 12) Hint log service (writes to Postgres `hints_log`)

`backend/src/services/hintLog.service.ts`

```ts
import db from "../config/db";

export default {
  async log(questionId: number, hintLevel: number, generatedText: string, userId?: number) {
    try {
      await db.query(
        "INSERT INTO hints_log(question_id, hint_level, user_id, generated_text) VALUES($1,$2,$3,$4)",
        [questionId, hintLevel, userId || null, generatedText]
      );
    } catch (err) {
      console.error("Failed to log hint:", err);
    }
  }
};
```

---

# 13) Questions controller & route (upload + list)

`backend/src/controllers/questions.controller.ts`

```ts
import { Request, Response } from "express";
import pdfParser from "../services/pdfParser.service";
import questionStore from "../services/questionStore.service";

export async function uploadPdf(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "pdf file is required" });
    const buffer: Buffer = req.file.buffer;
    const parsed = await pdfParser.parsePdfBuffer(buffer);
    const added = await questionStore.addMany(parsed);
    return res.json({ added, message: "Parsed and added (ids may be set automatically)" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed to parse pdf" });
  }
}

export async function listQuestions(req: Request, res: Response) {
  try {
    const qs = await questionStore.readAll();
    res.json({ questions: qs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to read questions" });
  }
}
```

`backend/src/routes/questions.routes.ts`

```ts
import { Router } from "express";
import multer from "multer";
import { uploadPdf, listQuestions } from "../controllers/questions.controller";

const upload = multer(); // memory storage
const router = Router();

router.post("/upload", upload.single("pdf"), uploadPdf);
router.get("/", listQuestions);

export default router;
```

---

# 14) Hints controller & route (generate + update JSON)

`backend/src/controllers/hints.controller.ts`

```ts
import { Request, Response } from "express";
import questionStore from "../services/questionStore.service";
import claude from "../services/ai/claude.service";
import hintLog from "../services/hintLog.service";

export async function requestHint(req: Request, res: Response) {
  try {
    const { questionId, level, userId } = req.body;
    if (!questionId || !level) return res.status(400).json({ error: "questionId and level required" });

    const q = await questionStore.getById(Number(questionId));
    if (!q) return res.status(404).json({ error: "question not found" });

    // choose the field
    const field = level === 1 ? "hint1" : level === 2 ? "hint2" : "solution";
    // if already exists, return it
    // @ts-ignore
    if (q[field] && q[field].trim().length > 0) {
      return res.json({ text: q[field], fromCache: true });
    }

    // generate via Claude
    const generated = await claude.generateHint(q.questionText, Number(level));

    // save to JSON
    await questionStore.updateById(q.id, { [field]: generated });

    // log to Postgres
    await hintLog.log(q.id, Number(level), generated, userId ? Number(userId) : undefined);

    return res.json({ text: generated, fromCache: false });
  } catch (err) {
    console.error("requestHint error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
```

`backend/src/routes/hints.routes.ts`

```ts
import { Router } from "express";
import { requestHint } from "../controllers/hints.controller";

const router = Router();
router.post("/", requestHint);
export default router;
```

---

# 15) `src/app.ts` (Express app wiring)

```ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import questionsRouter from "./routes/questions.routes";
import hintsRouter from "./routes/hints.routes";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

app.use("/api/questions", questionsRouter);
app.use("/api/hints", hintsRouter);

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

export default app;
```

---

# 16) `src/index.ts` (server start)

```ts
import dotenv from "dotenv";
dotenv.config();
import app from "./app";

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Hintify backend listening on http://localhost:${PORT}`);
});
```

---

# 17) Quick run & usage instructions

1. **Start Postgres container**

   From the repository root:

   ```bash
   cd infra
   docker-compose up -d
   ```

   This will start `msme_pg` on host port `5432` and run `init.sql` once (creating `hintify_AI_qa_web` and `app_owner` if not already present).

2. **Install backend deps**

   ```bash
   cd backend
   cp .env.example .env
   # edit .env to set ANTHROPIC_API_KEY, etc.
   npm install
   npm run dev
   ```

3. **Upload a PDF (teacher)**

   ```
   POST http://localhost:3001/api/questions/upload
   form-data: pdf (file)
   ```

   Response: parsed questions added to `data/questions.json`

4. **List questions**

   ```
   GET http://localhost:3001/api/questions
   ```

5. **Student requests a hint**

   ```
   POST http://localhost:3001/api/hints
   body JSON: { "questionId": 5, "level": 1, "userId": 123 }
   ```

   * If hint field already present in `questions.json`, API returns it immediately.
   * If empty, backend calls Anthropic and saves the text into `questions.json` and logs the event into Postgres `hints_log`.

---

# 18) Security & production notes (short)

* Don’t store `ANTHROPIC_API_KEY` in source control; use secrets manager in production.
* For production, set up TLS & run backend in a container or VM.
* The PDF parser is naive — for production use OCR/layout-aware extraction or allow teacher manual review/edit of parsed questions.
* Consider moving `questions` storage to Postgres (or a lightweight DB) if you need transactions and concurrency. JSON file is simple for small-scale projects.
* Validate / sanitize all inputs before passing to the LLM.

---

# 19) Next steps I can do immediately (pick any)

* Generate these files as a downloadable ZIP (I can paste everything into one big message but it’s lengthy)
* Improve PDF parser to handle option letters (A/B/C/D) reliably (I can add regex improvements)
* Add user authentication (JWT) and role-based endpoints (teacher vs student)
* Convert questions storage to Postgres table instead of JSON

Tell me which one you want next and I’ll produce it.

If you want, I can now paste the entire code of any single file into chat in one message (e.g., the full `claude.service.ts` or `pdfParser.service.ts`) — but I already included every main file above ready to copy.
