# 🎨 **Hintify Frontend**

### *React-based intelligent tutoring UI with role-based dashboards and progressive hint chat*

<div align="center">
<img src="https://img.shields.io/badge/Framework-React%2018-61DAFB?style=for-the-badge">
<img src="https://img.shields.io/badge/Language-TypeScript%205.5-3178C6?style=for-the-badge">
<img src="https://img.shields.io/badge/Build-Vite%207-646CFF?style=for-the-badge">
<img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge">
<img src="https://img.shields.io/badge/Icons-Lucide%20React-F97316?style=for-the-badge">
</div>

---

# 📌 **Overview**

**Hintify Frontend** is a single-page React application that serves as the student and teacher interface for the Hintify tutoring platform.

It uses:

* **React 18 + TypeScript** — type-safe component tree with hooks for all local and global state
* **Vite 7** — instant HMR dev server and optimized production builds
* **Tailwind CSS** — utility-first styling with a custom warm color palette and class-based dark mode
* **AppContext (React Context API)** — global state management for auth, documents, and hint history without Redux
* **localStorage** — client-side persistence for sessions, uploaded documents, and hint request history

> This is a demo-quality frontend ready to be wired to the Hintify Express backend.

---

# 🧠 **Architecture**

```
User (Browser)
      |
      ↓
┌─────────────────────────────────────┐
│              App.tsx                │
│  Routing: LoginPage / Dashboard     │
│  Wrapped by: AppProvider (Context)  │
└────────────┬────────────────────────┘
             ↓
  ┌──────────────────────────────┐
  │         AppContext           │
  │  - Auth state & login logic  │
  │  - Document upload state     │
  │  - Hint request tracking     │
  │  - localStorage persistence  │
  └──────┬────────────┬──────────┘
         ↓            ↓
  TeacherDashboard  StudentDashboard
  - PDF Upload      - Chat Interface
  - Analytics Tab   - Document Viewer
         ↓            ↓
     AIService     PDFService
   (hint stubs)  (parse stubs)
```

---

# 🚀 **Features**

### 👥 Role-Based Dashboards
Login as a **Teacher** to upload PDFs and view per-student hint analytics, or as a **Student** to chat with the AI tutor. Each role gets a fully separate UI — no shared screens.

### 💬 Progressive Hint Chat
The student chat interface tracks hint escalation per question: first hint (blue), second hint (yellow), full solution (green). Messages are timestamped and color-coded by hint level so students can see their progression at a glance.

### 📊 Teacher Analytics Panel
A live table shows every student's hint usage per question number with color-coded Yes/No badges. Teachers can instantly see who needed help and at what level — no refresh required.

### 🌗 Light / Dark Theme
A custom `ThemeToggle` component switches between light and dark mode across every screen. Theme preference persists in `localStorage` between sessions.

### 🔐 Session Management
"Remember Me" keeps the session alive for 2 hours via localStorage with an expiry timestamp. Logout clears all user data, document state, and hint history from both context and storage.

### 🧩 Custom UI Components
`GlowButton` (orange/gray variants with scale animation), `NeonCheckbox` (styled accessible checkbox), and `ThemeToggle` (radio-button switcher) are reusable across the app and maintain consistent branding.

---

# ⚙️ **Tech Stack**

| Layer | Technology |
|-------|------------|
| UI Library | React 18.3.1 |
| Language | TypeScript 5.5.3 |
| Build Tool | Vite 7.2.2 |
| Styling | Tailwind CSS 3.4.1 + PostCSS + Autoprefixer |
| Icons | Lucide React 0.344.0 |
| State Management | React Context API (`AppContext`) |
| Persistence | Browser `localStorage` |
| Linting | ESLint 9.9.1 + TypeScript ESLint + React Hooks plugin |

---

# 📦 **Setup**

1. **Navigate to the frontend directory:**

```bash
cd frontend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start the development server:**

```bash
npm run dev
```

4. **Open in browser:**

```bash
http://localhost:5173
```

5. **Build for production:**

```bash
npm run build
```

---

# 🛡️ **Production Tips**

* Replace `localStorage` auth with secure JWT tokens stored in `httpOnly` cookies
* Connect `AIService` stubs to the real Hintify backend (`POST /api/hints`) instead of returning placeholder text
* Connect `PDFService` stubs to the real backend (`GET /api/questions`) for document rendering
* Use `React.lazy()` and `Suspense` to code-split the Teacher and Student dashboards for faster initial load
* Set up environment variables (`VITE_API_BASE_URL`) so the API base URL is not hardcoded

---

# 💡 **Roadmap**

* [ ] Wire `AIService` to real backend hint endpoint
* [ ] Implement PDF rendering in the student document viewer (`pdfjs-dist` or `react-pdf`)
* [ ] Add real-time teacher notifications when a student requests a hint (WebSocket)
* [ ] Profile picture upload and edit name/email in user settings
* [ ] Export student analytics table as CSV
* [ ] Full-text search inside the uploaded document

---

# 🔒 **Security Notes**

* Passwords are stored in plaintext in `localStorage` — **demo only, not production ready**
* No backend validation exists; all auth is client-side — add proper backend auth before any public deployment
* User-created accounts persist in `localStorage` across sessions — replace with a real user database
* Sanitize all chat inputs before sending to the AI backend to prevent prompt injection

---

# 📁 **Folder Structure**

```
frontend/
│
├── src/
│   ├── components/
│   │   ├── auth/           # LoginPage — login, signup, forgot password
│   │   ├── dashboard/      # StudentDashboard, TeacherDashboard
│   │   ├── layout/         # Header with user menu and theme toggle
│   │   └── ui/             # GlowButton, NeonCheckbox, ThemeToggle
│   │
│   ├── contexts/
│   │   └── AppContext.tsx   # Global state: auth, documents, hint history
│   │
│   ├── services/
│   │   ├── aiService.ts    # Hint generation stubs (backend integration point)
│   │   └── pdfService.ts   # PDF parsing stubs (backend integration point)
│   │
│   ├── types/
│   │   └── index.ts        # HintRequest, Message, StudentHintStats interfaces
│   │
│   ├── App.tsx             # Root component and route logic
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
├── tailwind.config.js      # Custom color palette (off-white, accent orange, etc.)
├── vite.config.ts          # Vite build config
└── tsconfig.json           # TypeScript config
```

---

# 🤝 **Contributing**

PRs and issues are welcome. Fork freely and build on top of this.

---

# 📜 **License**

MIT License — use freely.

---

# ❤️ **Credits**

* React — component model and hooks for state management
* Tailwind CSS — utility-first styling with dark mode support
* Lucide React — icon library used throughout the UI
* Vite — fast build tooling and dev server with HMR

---

# 🚀 Made with passion by **Akhil**

> *Clean, typed, and themeable — a frontend built for students who think before they peek.*
