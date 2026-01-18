
import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory: backend/
BASE_DIR = Path(__file__).resolve().parent

# Project Root: mcp-studio/
PROJECT_ROOT = BASE_DIR.parent

# Generated Files Directory: backend/generated/
GENERATED_DIR = BASE_DIR / "generated"

# Ensure directories exist
os.makedirs(GENERATED_DIR, exist_ok=True)
os.makedirs(GENERATED_DIR / "meta", exist_ok=True)

# Load Env
load_dotenv(BASE_DIR / ".env")

# Export Paths
UPLOAD_DIR = str(GENERATED_DIR)

print(f"[Config] Base Dir: {BASE_DIR}")
print(f"[Config] Upload Dir: {UPLOAD_DIR}")
