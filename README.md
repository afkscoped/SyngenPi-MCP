# MCP Studio

Full-stack synthetic data platform with Agentic AI capabilities.

## 🚀 Features

### 1. Synthetic Data Generation (Phase 1)
- Generate high-quality tabular data using **CTGAN + CopulaGAN**.
- Privacy controls (Low/Medium/High).
- Downloads as `.xlsx` with metadata.

### 2. AutoGluon ML (Phase 2)
- Built-in AutoML using **AutoGluon Tabular**.
- Just click "Train" to build state-of-the-art models.
- **Fallback Mode**: If AutoGluon is missing, automatically falls back to Scikit-Learn Random Forest.
- Prediction endpoints included.

### 3. Agentic Statistical Assurance (Phase 3)
- **Natural Language Interface**: Ask "Compare Revenue between A and B".
- **Big 4 Tests**: One-click T-Test, Regression, Correlation, Chi-Square.

### 4. Meta-Scientist (Phase 4)
- **Real Data**: One-click download & analysis of Kaggle datasets (Cookie Cats, Marketing).
- **Synthetic Loops**: Generate and pool 20+ experiments to find true effects.
- **Meta-Analysis**: Random-effects pooling, Heterogeneity (I²), Publication Bias detection.
- *Note: For Kaggle mode, ensure `KAGGLE_USERNAME` and `KAGGLE_KEY` are in `.env`.*

## 🛠️ Setup & Installation

### Backend
1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **AutoGluon (ML)**:
   AutoGluon is included in `requirements.txt`. 
   *Note: It has been pre-installed on this machine. If re-installing elsewhere, ensure you have C++ Build Tools on Windows.*

3. **Environment**:
   Create `.env` in `backend/` with:
## 🚀 Quick Start (Windows)

1.  **Configure Environment**:
    *   Rename `backend/.env.example` to `backend/.env`.
    *   Add your `OPENAI_API_KEY` and `SUPABASE_URL` / `KEY`.

2.  **Run the Studio**:
    *   Double-click `run_studio.bat` OR run via terminal:
        ```cmd
        cd mcp-studio
        .\run_studio.bat
        ```
    *   This script checks your environment, installs dependencies, and launches the Backend (Port 8000) and Frontend (Port 3000).

## 🧪 Testing

## 🐳 Docker
Build the unified backend:
```bash
docker build -t mcp-backend ./backend
```

## Architecture

- **frontend/**: Next.js 14 App Router + Tailwind + Supabase.
- **mcp_synthetic/**: Python Service (FastAPI) for CTGAN/CopulaGAN generation.
- **mcp_sheets/**: Python Service (FastAPI) for Agentic editing (LangChain + E2B).
- **mcp_analytics/**: Python Service (FastAPI) for Statistical Assurance (SAM).
- **orchestrator/**: Python Service (FastAPI/LangGraph) for workflow planning.

## Setup

1.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

2.  **Backends**:
    Create a venv and install requirements for each service.
    ```bash
    cd mcp_synthetic
    pip install -r requirements.txt
    python main.py
    ```
    Repeat for `mcp_sheets`, `mcp_analytics`, `orchestrator`.

## Environment Variables

Copy `frontend/.env.local.example` to `frontend/.env.local` and set keys.
Set `OPENAI_API_KEY` and `SUPABASE_*` keys for microservices.
