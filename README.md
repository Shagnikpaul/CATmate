# CatMate

CatMate is an AI-powered heavy equipment operator assistant and manager operations platform for Caterpillar machinery.

---

## 📁 Repository Structure

```text
catmate/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entrypoint, router includes, WebSocket setup
│   │   ├── config.py                  # env vars, DB URL, Groq API key, etc.
│   │   ├── database.py                # SQLAlchemy engine/session setup
│   │   ├── models/                    # SQLAlchemy ORM models (1 file per table group)
│   │   │   ├── user.py                # users, sessions, sites
│   │   │   ├── machine.py             # machines, machine_manuals, manual_chunks
│   │   │   ├── task.py                # tasks
│   │   │   ├── telemetry.py           # telemetry
│   │   │   ├── incident.py            # incidents
│   │   │   ├── behavior.py            # behavior_flags
│   │   │   └── training.py            # training_modules, training_assignments
│   │   ├── schemas/                   # Pydantic request/response models, mirrors the API JSON in the PRD
│   │   │   ├── auth.py
│   │   │   ├── task.py
│   │   │   ├── incident.py
│   │   │   ├── training.py
│   │   │   ├── behavior.py
│   │   │   ├── prediction.py
│   │   │   └── assistant.py
│   │   ├── routers/                   # one router per endpoint group in section 5
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   ├── machines.py
│   │   │   ├── incidents.py
│   │   │   ├── training.py
│   │   │   ├── behavior.py
│   │   │   ├── predictions.py
│   │   │   ├── assistant.py
│   │   │   ├── manager.py
│   │   │   └── ws.py                  # WebSocket endpoint for live manager updates
│   │   ├── services/                  # business logic, kept out of routers
│   │   │   ├── auth_service.py        # password hashing, session create/validate
│   │   │   ├── rule_engine.py         # section 6c behavior flag rules
│   │   │   ├── predictor.py           # loads pickled sklearn model, runs inference
│   │   │   ├── llm_service.py         # Groq calls: intent routing, incident structuring, RAG answers
│   │   │   ├── rag_service.py         # FAISS index build/query over manual_chunks
│   │   │   └── telemetry_simulator.py # generates synthetic live machine status
│   │   └── ml/
│   │       ├── train_predictor.py     # trains & pickles the task-time regression model
│   │       ├── predictor.pkl          # trained model artifact (generated, gitignored)
│   │       └── build_faiss_index.py   # chunks manual PDFs, embeds, builds FAISS index
│   ├── data/
│   │   ├── generate_synthetic_data.py # section 6b generator script
│   │   ├── telemetry.csv              # generated
│   │   ├── task_history.csv           # generated
│   │   └── manuals/                   # the 3–4 real CAT manual PDFs for RAG
│   ├── alembic/                       # migrations, if used
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # router setup (React Router)
│   │   ├── api/
│   │   │   └── client.ts              # fetch wrapper, attaches auth token
│   │   ├── hooks/
│   │   │   ├── useVoice.ts            # wraps Web Speech API (STT + TTS)
│   │   │   └── useWebSocket.ts        # manager live-update subscription
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn components
│   │   │   ├── TaskCard.tsx
│   │   │   ├── PaceIndicator.tsx
│   │   │   ├── MicButton.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── IncidentPreviewCard.tsx
│   │   ├── pages/                     # one per screen in section 7a
│   │   │   ├── Login.tsx
│   │   │   ├── OperatorHome.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── IncidentLog.tsx
│   │   │   ├── TrainingHub.tsx
│   │   │   ├── ManagerOverview.tsx
│   │   │   ├── ManagerTaskAllocation.tsx
│   │   │   └── ManagerIncidentLog.tsx
│   │   └── store/                     # lightweight state (zustand/context) for auth user + session
│   ├── index.html
│   ├── tailwind.config.ts
│   └── package.json
│
└── README.md                          # setup + run instructions for the team
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- (Optional) PostgreSQL or SQLite for local database

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=sqlite:///./catmate.db
   GROQ_API_KEY=your_groq_api_key_here
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   ```

5. **Run the backend development server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API Documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` or `.env.local` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_WS_BASE_URL=ws://localhost:8000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

---

## 🛠️ Key Features

- **Operator Voice Assistant**: Hands-free voice interface for equipment operators in cab.
- **Predictive Task Timing**: Machine learning model forecasting task completion times based on live telemetry and historical performance.
- **Live Telemetry & Fleet Monitoring**: Real-time WebSocket streaming for site managers to monitor equipment status, pace, and behavior alerts.
- **RAG Manual Support**: Retrieval-Augmented Generation over official CAT machinery manuals for instant troubleshooting assistance.
- **Incident & Behavior Logging**: Automated detection of erratic operation, equipment warnings, and rapid safety logging.
