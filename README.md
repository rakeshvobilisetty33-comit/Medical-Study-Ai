# MedStudy AI — Full-Stack AI Medical Study Workspace

MedStudy AI is a full-stack, AI-powered medical study workspace built specifically for medical students. It enables students to organize revision resources by subject/topic, upload textbooks and lecture slide PDFs, converse with their materials via a grounded RAG pipeline, and generate structured summaries, flippable flashcard decks, practice quizzes, and visual process flowcharts.

---

## 1. Features & Workflows
* **Direct Access & No Auth**: Starts instantly by prompting for the student's name on first launch, storing preferences in `localStorage`.
* **Three-Panel Learning Space**:
  * **Left Panel**: Workspace documents listing, upload controls, extraction status monitors, and active page-by-page reader.
  * **Center Panel**: RAG-grounded conversation thread with Markdown support and browser speech synthesis.
  * **Right Panel**: Actions dashboard for generating study guides, revision notes, MCQs, and memory mnemonics.
* **Assessments & Spaced Repetition**: Dynamic quiz grader with weak-topic reviews, and deck carousels with difficulty ratings.
* **Visual Learning Map**: Generates concept flowcharts in Markdown/Mermaid layout.
* **Global Search Index**: Search instantly across all workspaces, documents, notes, flashcards, and quizzes.

---

## 2. Technology Stack
* **Frontend**: React.js, Vite, TypeScript, Tailwind CSS, Lucide React, Axios.
* **Backend**: Node.js, Express.js, MongoDB, Mongoose, Multer, PDF-Parse.
* **AI Abstraction**: Connecting to Gemini API (`gemini-1.5-flash`), OpenAI API (`gpt-4o-mini`), or a RAG-powered offline Mock AI service.

---

## 3. Project Structure
```text
medstudy-ai/
├── client/                 # React Frontend
│   ├── public/             # SVGs, Favicon, assets
│   ├── src/
│   │   ├── components/     # UI Buttons, Chat, Quiz Panels, Viewer
│   │   ├── pages/          # Home, Workspace, Cards, Planner, Progress
│   │   ├── services/       # Axios API client
│   │   ├── hooks/          # useChat, useSources, useStudySession
│   │   ├── utils/          # Storage, Speech, Formatting helpers
│   │   └── main.tsx
├── server/                 # Express Backend
│   ├── config/             # DB & AI configurations
│   ├── controllers/        # Express handlers (workspace, chat, quiz, source)
│   ├── middleware/         # Multer configuration, error catcher
│   ├── models/             # Mongoose Schemas (Source, Quiz, Progress)
│   ├── routes/             # Express Routing endpoints
│   ├── services/           # PDF parsers, RAG retrievers, AI queries
│   └── server.js
├── README.md               # User guide documentation
└── package.json            # Root command orchestration scripts
```

---

## 4. Setup & Installation

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (running locally at `mongodb://localhost:27017` or a MongoDB Atlas connection cloud URI)

### Setup Steps
1. **Clone/Move into Workspace**:
   Ensure you are in the project root directory.

2. **Configure Environment Variables**:
   Create a `.env` file inside the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/medstudy
   AI_PROVIDER=mock  # 'gemini' | 'openai' | 'mock'
   
   # Optional: Add keys to activate external AI models
   # GEMINI_API_KEY=your_gemini_key_here
   # OPENAI_API_KEY=your_openai_key_here
   ```

3. **Install Dependencies**:
   Install all dependencies for root, client, and server:
   ```bash
   npm run install:all
   ```

4. **Launch Development Servers**:
   Run both client and server development servers concurrently:
   ```bash
   npm run dev
   ```
   * The Express API will start on: `http://localhost:5000`
   * The Vite client will launch on: `http://localhost:5173` (with `/api` proxying active)

5. **Build for Production**:
   To test compile parameters and verify TSC rules:
   ```bash
   npm run build:client
   ```
