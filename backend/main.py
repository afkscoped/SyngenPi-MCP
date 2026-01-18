
# Load environment variables FIRST before any other imports that need them
from dotenv import load_dotenv
load_dotenv("backend/.env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import synthetic, sheets, analytics, orchestrator, ml, meta, system

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="MCP Studio Unifed Backend")

# Ensure generated dirs exist
os.makedirs("backend/generated", exist_ok=True)
os.makedirs("backend/generated/meta", exist_ok=True)
app.mount("/files", StaticFiles(directory="backend/generated"), name="generated")

# CORS - Allow frontend to call
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(system.router)
app.include_router(synthetic.router)
app.include_router(sheets.router)
app.include_router(analytics.router)
app.include_router(orchestrator.router)
app.include_router(ml.router)
app.include_router(meta.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
