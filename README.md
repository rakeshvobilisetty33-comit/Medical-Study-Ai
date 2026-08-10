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
* **Node.js**: v18 or higher (v20+ recommended)
* **Git**: Installed on your system
* **MongoDB (Optional)**: If not installed or running, the application will automatically activate its built-in **offline JSON database fallback**, writing persistent data directly to `server/data/`. This allows full feature access immediately with zero database dependencies.

### Setup Steps

1. **Clone the Repository**:
   Clone the repository from GitHub and navigate into the root directory:
   ```bash
   git clone https://github.com/janagarlabhavana-07/medicalstudy.git
   cd medicalstudy
   ```

2. **Configure Environment Variables**:
   Copy the example environment configuration template to create your active `.env` file in the `server/` directory:
   * **Linux/macOS**:
     ```bash
     cp .env.example server/.env
     ```
   * **Windows (Command Prompt / PowerShell)**:
     ```cmd
     copy .env.example server\.env
     ```

   Verify the variables inside `server/.env`:
   * `PORT`: Server API port (default: `5000`)
   * `MONGO_URI`: MongoDB connection string (default: `mongodb://127.0.0.1:27017/medstudy`). If offline or MongoDB isn't running, the server switches to local JSON files in `server/data/`.
   * `AI_PROVIDER`: Choose `mock` (offline, default), `gemini`, or `openai`.
   * `GEMINI_API_KEY` / `OPENAI_API_KEY`: API keys for active providers.

3. **Install Dependencies**:
   Install root dev dependencies first, then install package trees for both client and server:
   ```bash
   # Install root packages
   npm install

   # Install client and server packages
   npm run install:all
   ```

4. **Running the Application**:
   You can start both the client and server concurrently using a single command, or start them individually:
   * **Concurrent Mode (Recommended)**:
     ```bash
     npm run dev
     ```
     * The Express API starts on `http://localhost:5000`
     * The Vite client starts on `http://localhost:5173` (with proxy forwarding to the backend)
   * **Start Backend Only**:
     ```bash
     npm run start:server
     ```
   * **Start Frontend Only**:
     ```bash
     npm run start:client
     ```

5. **Build for Production**:
   Compile frontend assets to verify type checking and generate static production bundles:
   ```bash
   npm run build:client
   ```

