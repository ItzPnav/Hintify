# File Tree: Hintify

```
├── 📁 backend
│   ├── 📁 ${DATA_DIR}
│   │   └── ⚙️ questions.json
│   ├── 📁 data
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
│   │   │   ├── 📄 documents.controller.ts
│   │   │   ├── 📄 hints.controller.ts
│   │   │   └── 📄 questions.controller.ts
│   │   ├── 📁 routes
│   │   │   ├── 📄 documents.routes.ts
│   │   │   ├── 📄 hints.routes.ts
│   │   │   └── 📄 questions.routes.ts
│   │   ├── 📁 services
│   │   │   ├── 📁 ai
│   │   │   │   └── 📄 claude.service.ts
│   │   │   ├── 📄 hintLog.service.ts
│   │   │   ├── 📄 pdfParser.service.ts
│   │   │   ├── 📄 pdfStore.service.ts
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
├── 📁 frontend
│   ├── 📁 .bolt
│   │   ├── ⚙️ config.json
│   │   └── 📄 prompt
│   ├── 📁 .vite
│   │   └── 📁 deps
│   │       ├── ⚙️ _metadata.json
│   │       └── ⚙️ package.json
│   ├── 📁 public
│   │   └── 🖼️ image.png
│   ├── 📁 src
│   │   ├── 📁 components
│   │   │   ├── 📁 auth
│   │   │   │   └── 📄 LoginPage.tsx
│   │   │   ├── 📁 dashboard
│   │   │   │   ├── 📄 StudentDashboard.tsx
│   │   │   │   └── 📄 TeacherDashboard.tsx
│   │   │   ├── 📁 layout
│   │   │   │   └── 📄 Header.tsx
│   │   │   └── 📁 ui
│   │   │       ├── 📄 GlowButton.tsx
│   │   │       ├── 📄 NeonCheckbox.tsx
│   │   │       └── 📄 ThemeToggle.tsx
│   │   ├── 📁 contexts
│   │   │   └── 📄 AppContext.tsx
│   │   ├── 📁 services
│   │   │   ├── 📄 aiService.ts
│   │   │   ├── 📄 documentService.ts
│   │   │   └── 📄 pdfService.ts
│   │   ├── 📁 types
│   │   │   └── 📄 index.ts
│   │   ├── 📄 App.tsx
│   │   ├── 🎨 index.css
│   │   ├── 📄 main.tsx
│   │   └── 📄 vite-env.d.ts
│   ├── ⚙️ .gitignore
│   ├── 📝 README.md
│   ├── 📄 eslint.config.js
│   ├── 🌐 index.html
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   ├── 📄 postcss.config.js
│   ├── 📄 tailwind.config.js
│   ├── ⚙️ tsconfig.app.json
│   ├── ⚙️ tsconfig.json
│   ├── ⚙️ tsconfig.node.json
│   └── 📄 vite.config.ts
├── 📁 infra
│   ├── ⚙️ docker-compose.yml
│   ├── 📄 init.sql
│   └── 📄 setup_hintify_db.sql
├── 📝 BACKEND_EXPLAINED.md
├── 📝 FRONTEND_DOCUMENTATION.md
├── 📝 FULL_REPO_LAYOUT.md
├── 📝 README.md
├── ⚙️ package-lock.json
└── ⚙️ package.json
```