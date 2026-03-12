# Hintify Frontend Documentation

## Overview

**Hintify** is a React-based web application designed to facilitate intelligent tutoring through an AI-powered hint system. It's built for teachers to upload educational documents (PDFs) and for students to interact with those documents using a chatbot-style interface that provides progressive hints and solutions.

The application features a modern, responsive UI with theme support (light/dark mode), role-based authentication, and document analysis capabilities.

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                          # Main app component with routing logic
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Global styles
│   ├── vite-env.d.ts                    # Vite environment types
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx            # Authentication UI (Login, Signup, Password Reset)
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.tsx     # Student interface with chat and document viewer
│   │   │   └── TeacherDashboard.tsx     # Teacher interface for uploads and analytics
│   │   ├── layout/
│   │   │   └── Header.tsx               # Top navigation bar with user menu
│   │   └── ui/
│   │       ├── GlowButton.tsx           # Custom button with glow effect
│   │       ├── NeonCheckbox.tsx         # Custom checkbox component
│   │       └── ThemeToggle.tsx          # Dark/Light theme switcher
│   │
│   ├── contexts/
│   │   └── AppContext.tsx               # Global state management using React Context
│   │
│   ├── services/
│   │   ├── aiService.ts                 # AI response generation and hint logic
│   │   └── pdfService.ts                # PDF parsing and text extraction (placeholder)
│   │
│   └── types/
│       └── index.ts                     # TypeScript interface definitions
│
├── public/                               # Static assets
├── package.json                         # Dependencies and scripts
├── vite.config.ts                       # Vite build configuration
├── tailwind.config.js                   # Tailwind CSS configuration
├── tsconfig.json                        # TypeScript configuration
└── eslint.config.js                     # ESLint configuration
```

---

## Technology Stack

### Core Framework
- **React 18.3.1** - UI library with hooks for state management
- **TypeScript 5.5.3** - Type-safe JavaScript
- **Vite 7.2.2** - Lightning-fast build tool and dev server

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.4.35** - CSS transformations
- **Autoprefixer 10.4.18** - Browser prefixes

### Icons & UI
- **Lucide React 0.344.0** - Beautiful icon library
- **NeonCheckbox & GlowButton** - Custom styled components

### Utilities
- **PDF Parse 1.1.1** - PDF text extraction (referenced but needs backend integration)

### Development Tools
- **ESLint 9.9.1** - Code linting
- **TypeScript ESLint** - TS-specific linting
- **React Hooks ESLint Plugin** - React best practices checking

---

## Key Components

### 1. **App.tsx** (Main Component)
- Routes users based on authentication status
- Shows `LoginPage` if not logged in
- Shows `TeacherDashboard` or `StudentDashboard` based on user role
- Wraps everything in `AppProvider` for global state

### 2. **AppContext.tsx** (State Management)
Manages global application state including:

#### State Properties:
- `theme` - Current theme (light/dark)
- `user` - Logged-in user object with id, username, email, role
- `isLoggedIn` - Boolean flag for authentication status
- `documentUploaded` - Whether teacher has uploaded a document
- `uploadedDocument` - Filename of uploaded document
- `documentText` - Extracted text from PDF
- `hintRequests` - Array of student hint requests

#### Key Functions:
- `login(email, password, role, rememberMe)` - Authenticate user
- `signup(username, email, password, role)` - Create new account
- `forgotPassword(email)` - Password recovery
- `logout()` - Clear session
- `addHintRequest()` - Record when student asks for help
- `updateHintRequest()` - Track hint progression (1st, 2nd, solution)
- `getStudentHintStats()` - Generate analytics for teacher view

#### Persistence:
Uses `localStorage` to persist:
- User session (with 2-hour expiry if "Remember Me" is checked)
- Document upload status
- Hint request history
- User-created accounts

#### Mock Users (Demo Data):
```
- Alice (student) - alice@gmail.com / test@123
- Bob (student) - bob@gmail.com / test@456
- Akhil (teacher) - katakamakki@gmail.com / akhil@632
```

### 3. **LoginPage.tsx** (Authentication UI)
- **Modes**: Login, Signup, Forgot Password
- **Features**:
  - Role-based authentication (Student/Teacher toggle)
  - Password strength validation (min 6 chars)
  - "Remember Me" session persistence
  - Email validation
  - Password confirmation for signup
  - Responsive form layout

### 4. **TeacherDashboard.tsx** (Teacher Interface)

#### Two Main Tabs:

**A) Document Upload Tab:**
- Drag-and-drop or click-to-upload PDF
- Visual feedback with loading state
- Success animation on completion
- Extracts text using PDFService
- Stores document state globally

**B) Student Analytics Tab:**
- Table showing each student's hint usage
- Columns: Question Number, 1st Hint (Yes/No), 2nd Hint (Yes/No)
- Total hint count per student
- Color-coded badges (green for used, red for not used)
- Empty state message if no data

### 5. **StudentDashboard.tsx** (Student Interface)

#### Two Main Sections:

**A) Chat Interface (Left Side):**
- Message history with timestamps
- User messages: orange background (right-aligned)
- AI responses: color-coded by hint type
  - 💡 **First Hint** - Blue background
  - 🔍 **Second Hint** - Yellow background
  - ✅ **Complete Solution** - Green background
- Loading animation while AI is thinking
- Input field with send button (disabled when loading)
- Empty state prompt on first load
- Keyboard support: Enter to send message

**B) Document Viewer (Right Side):**
- Displays uploaded PDF
- Toolbar with buttons: Zoom In/Out, Rotate, Print, Download
- Modal overlay for full-screen viewing
- Placeholder currently (needs backend PDF rendering)

#### AI Hint Logic:
Uses `AIService` to:
1. Detect if user is asking for help
2. Extract question number from message
3. Track hint progression:
   - First ask → 1st hint
   - "More help/Still don't understand" → 2nd hint
   - Further request → Full solution
4. Create/update hint request records

### 6. **Header.tsx** (Navigation)
- Logo with "H" icon and "Hintify" text
- User menu dropdown (right side)
- Displays username and email
- Theme toggle (Light/Dark)
- Menu options: Edit Name, Change Picture, Settings, Logout
- Sticky positioning
- Click-outside to close menu

### 7. **Custom UI Components**

#### GlowButton.tsx
```tsx
// Customizable button with glow effect
<GlowButton variant="primary" onClick={handler}>
  Upload Document
</GlowButton>

// Props:
- variant: 'primary' (orange) | 'secondary' (gray)
- disabled: boolean
- className: additional Tailwind classes
```
Features:
- Smooth glow shadow effect
- Scale animation on hover/click
- Focus ring styling
- Responsive sizing

#### NeonCheckbox.tsx
```tsx
// Custom checkbox with neon styling
<NeonCheckbox 
  checked={rememberMe} 
  onChange={setRememberMe}
  label="Remember me"
/>
```
Features:
- Accessible input (hidden checkbox)
- Custom styled box with border
- Checkmark SVG inside
- Hover glow effect
- Smooth transitions

#### ThemeToggle.tsx
- Radio-button style theme switcher
- Light mode with sun icon
- Dark mode with moon icon
- Active button highlighted in accent color

### 8. **AIService.ts** (Hint Generation)

Placeholder service with methods:

```typescript
AIService.isRequestingHelp(message)        // Detects help keywords
AIService.isRequestingMoreHelp(message)    // Detects escalation phrases
AIService.extractQuestionNumber(message)   // Parses "question X" or digit
AIService.generateResponse(message, hintLevel) // Returns hint text
```

**Status**: Currently returns placeholder text. Needs integration with actual AI API (OpenAI, Claude, etc.)

### 9. **PDFService.ts** (Document Processing)

Placeholder service methods:
```typescript
PDFService.load(file)      // Load PDF from file or URL
PDFService.getText(page)   // Extract text from specific page
PDFService.download()      // Download functionality
```

**Status**: Needs backend integration for actual PDF parsing

### 10. **Types/index.ts** (TypeScript Interfaces)

```typescript
// Hint request tracking
interface HintRequest {
  id: string;
  studentId: string;
  studentName: string;
  questionNumber: number;
  question: string;
  firstHintAsked: boolean;
  secondHintAsked: boolean;
  solutionGiven: boolean;
  timestamp: Date;
}

// Analytics data
interface StudentHintStats {
  studentId: string;
  studentName: string;
  questionHints: { [questionNumber: number]: { firstHint: boolean; secondHint: boolean } };
  totalHints: number;
}

// Chat messages
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'hint1' | 'hint2' | 'solution';
}
```

---

## Color Scheme (Tailwind Config)

Custom color palette:
- **off-white**: `#FFFCF2` - Light background
- **soft-gray**: `#CCC5B9` - Secondary text/borders
- **warm-gray**: `#403D39` - Primary text
- **dark-tone**: `#252422` - Dark background
- **accent**: `#EB5E28` - Orange highlight (buttons, active states)

This creates a warm, readable color scheme suitable for an educational app.

---

## Authentication Flow

### Login Process:
1. User selects role (Student/Teacher) and enters credentials
2. Checked against mock user database
3. Session stored in context and localStorage
4. Redirected to appropriate dashboard
5. Session expires after 2 hours if "Remember Me" unchecked

### Signup Process:
1. User enters username, email, password (min 6 chars)
2. Confirms password matches
3. Email validated for uniqueness
4. New user added to mock database
5. Persisted to localStorage
6. Redirected to login

### Logout:
- Clears all user data from state
- Removes localStorage entries
- Resets document state
- Returns to LoginPage

---

## Data Flow

```
User Interaction
    ↓
Component State Update
    ↓
AppContext (Global State)
    ↓
localStorage Persistence
    ↓
Other Components Updated (via useApp hook)
```

### Example: Student Asks for Hint
1. Student types message and presses Send
2. `StudentDashboard` calls `AIService.isRequestingHelp()`
3. If help request detected:
   - Extracts question number
   - Finds/creates HintRequest record
   - Calls `addHintRequest()` or `updateHintRequest()`
   - AppContext updates hintRequests array
   - localStorage updated automatically
4. `AIService.generateResponse()` called
5. AI message added to chat
6. Teacher can view updated stats immediately

---

## Key Features

✅ **Dual Role System** - Different UIs for teachers and students
✅ **Progressive Hints** - First hint → Second hint → Full solution
✅ **Analytics** - Track student help-seeking behavior
✅ **Theme Support** - Light and dark mode throughout
✅ **Session Management** - Remember me functionality
✅ **Persistent Storage** - State preserved across sessions
✅ **Responsive Design** - Works on mobile, tablet, desktop
✅ **Type Safety** - Full TypeScript implementation
✅ **Custom Components** - Glowing buttons, neon checkboxes
✅ **Accessibility** - Semantic HTML, keyboard navigation

---

## Development Commands

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## TODO / In Progress

- [ ] **Backend Integration**: Replace mock users with API calls
- [ ] **PDF Processing**: Integrate actual PDF parsing on backend
- [ ] **AI Integration**: Connect to LLM API for real hint generation
- [ ] **Real Database**: Replace localStorage with backend database
- [ ] **User Profiles**: Profile picture upload, edit name/email
- [ ] **Settings**: Configurable hint difficulty, response timeout
- [ ] **Notifications**: Real-time updates for teachers/students
- [ ] **Export Analytics**: Download student reports as CSV/PDF
- [ ] **Search**: Full-text search in document
- [ ] **Question Bank**: Teachers create questions, not just upload PDFs

---

## Environment Setup

**Node.js Version**: 16+ (recommended 18+)
**Package Manager**: npm

**Installation**:
```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` (Vite default)

---

## Browser Support

Modern browsers with ES2020+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

---

## Notes for Developers

1. **State Management**: AppContext used for global state. No Redux/Zustand needed currently.
2. **Styling**: Tailwind CSS with custom color config. No CSS-in-JS needed.
3. **Icons**: All from Lucide React. Check documentation for available icons.
4. **Dark Mode**: Automatic class-based dark mode via Tailwind.
5. **PDF Integration**: Currently placeholder. Consider `pdfjs-dist` or `react-pdf` for rendering.
6. **AI Service**: Currently placeholder. Needs backend API for real responses.
7. **Form Validation**: Basic frontend validation. Backend validation needed for security.

---

## File Size Estimate

- Bundle size: ~250KB (gzipped ~80KB with Vite optimization)
- No external CDN dependencies
- Tree-shaking enabled for unused Lucide icons

---

## Performance Optimizations

1. **Vite**: Instant HMR and optimized dev server
2. **Code Splitting**: React lazy loading supported
3. **CSS Purging**: Tailwind removes unused styles
4. **Image Optimization**: No heavy images in current version
5. **LocalStorage**: No API calls on initial load (uses cached data)

---

## Security Considerations

⚠️ **This is a demo/educational project**:
- Passwords stored in plaintext (localStorage) - ❌ NOT PRODUCTION READY
- No backend authentication - ❌ security risk
- No HTTPS enforcement - ❌ needs to be added
- Client-side validation only - ❌ backend validation needed

**For Production**:
- Use proper backend authentication (JWT/OAuth)
- Hash passwords with bcrypt
- Implement HTTPS
- Add CSRF protection
- Sanitize all user inputs
- Use secure session tokens

---

## Support & Issues

For issues or questions about the frontend:
1. Check component JSX comments
2. Review the TypeScript interfaces
3. Test with mock data first
4. Check browser console for errors
5. Ensure Node.js and npm are updated

---

## Summary

**Hintify Frontend** is a modern, type-safe React application built for educational collaboration. It features role-based access, real-time chat for AI-powered hints, and analytics for tracking student progress. The codebase is clean, well-organized, and ready for backend integration and feature expansion.

The application successfully demonstrates:
- ✅ React hooks and context API usage
- ✅ TypeScript best practices
- ✅ Responsive UI design with Tailwind CSS
- ✅ Component composition and reusability
- ✅ State management and persistence
- ✅ Accessibility considerations

**Next Steps**: Integrate with backend API for authentication, PDF processing, and AI hint generation.
