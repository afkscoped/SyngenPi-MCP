"""
Synthetic Data Generation Router - Fixed with proper error handling
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import traceback
import os
from backend.config import UPLOAD_DIR

router = APIRouter(prefix="/synthetic", tags=["synthetic"])

class GenerateRequest(BaseModel):
    dataset_id: Optional[str] = None
    domain: str = "finance"
    rows: int = 100
    seed: Optional[int] = None
    privacy_level: str = "medium"

@router.post("/generate")
async def generate_data(req: GenerateRequest):
    """Generate synthetic data with proper error handling"""
    try:
        from backend.services.syngen_core import SyngenCore
        
        engine = SyngenCore()
        result = engine.generate(
            dataset_id=req.dataset_id,
            rows=req.rows,
            domain=req.domain,
            seed=req.seed,
            privacy_level=req.privacy_level
        )
        
        if result.get("status") == "error":
            return JSONResponse(
                status_code=400,
                content={"error": result.get("message", "Generation failed")}
            )
        
        return result
        
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Generation failed: {str(e)}"}
        )

@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download a generated file"""
    try:
        filepath = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(filepath):
            return JSONResponse(status_code=404, content={"error": "File not found"})
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/list")
async def list_files():
    """List generated files"""
    try:
        files = []
        if os.path.exists(UPLOAD_DIR):
            for f in os.listdir(UPLOAD_DIR):
                if f.endswith(('.xlsx', '.csv')):
                    filepath = os.path.join(UPLOAD_DIR, f)
                    files.append({
                        "name": f,
                        "size": os.path.getsize(filepath),
                        "url": f"http://localhost:8000/files/{f}"
                    })
        return {"files": files}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
