"""
Sheets Router - Fixed with proper error handling and Excel export
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.config import UPLOAD_DIR
import os
import pandas as pd
import io
from datetime import datetime
import traceback

router = APIRouter(prefix="/sheets", tags=["Sheets"])

# UPLOAD_DIR imported from config


class LoadRequest(BaseModel):
    url: str

class SaveRequest(BaseModel):
    url: str
    rows: List[Dict[str, Any]]

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV/Excel file"""
    try:
        # Generate unique filename
        safe_name = file.filename.replace(" ", "_") if file.filename else "upload.csv"
        unique_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{safe_name}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return {
            "status": "success",
            "filename": unique_name,
            "url": f"http://localhost:8000/files/{unique_name}",
            "path": file_path,
            "size": len(contents)
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/load")
async def load_sheet(req: LoadRequest):
    """Load a sheet from URL or filename"""
    try:
        # Extract filename from URL
        if req.url.startswith("http"):
            filename = req.url.split("/")[-1]
        else:
            filename = req.url
        
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        if not os.path.exists(filepath):
            # Try without timestamp prefix
            for f in os.listdir(UPLOAD_DIR):
                if filename in f or f.endswith(filename):
                    filepath = os.path.join(UPLOAD_DIR, f)
                    break
        
        if not os.path.exists(filepath):
            return JSONResponse(status_code=404, content={"error": f"File not found: {filename}"})
        
        # Load file
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath, sheet_name=0)
        
        # Convert to columns and rows format
        columns = [{"key": col, "name": col, "editable": True} for col in df.columns]
        rows = df.to_dict(orient='records')
        
        return {
            "status": "success",
            "columns": columns,
            "rows": rows,
            "total": len(rows)
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/save")
async def save_sheet(req: SaveRequest):
    """Save edited rows back to file"""
    try:
        # Extract filename
        if req.url.startswith("http"):
            filename = req.url.split("/")[-1]
        else:
            filename = req.url
        
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Find actual file
        if not os.path.exists(filepath):
            for f in os.listdir(UPLOAD_DIR):
                if filename in f:
                    filepath = os.path.join(UPLOAD_DIR, f)
                    break
        
        # Convert to DataFrame and save
        df = pd.DataFrame(req.rows)
        
        if filepath.endswith('.csv'):
            df.to_csv(filepath, index=False)
        else:
            df.to_excel(filepath, index=False, engine='openpyxl')
        
        return {"status": "success", "message": "Saved successfully", "rows_saved": len(req.rows)}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/export/xlsx/{filename}")
async def export_xlsx(filename: str):
    """Export a dataset as Excel .xlsx file"""
    try:
        # Try to find the file
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        if not os.path.exists(filepath):
            # Try with common extensions
            for ext in ['', '.csv', '.xlsx', '.xls']:
                test_path = os.path.join(UPLOAD_DIR, filename + ext) if ext else filepath
                if os.path.exists(test_path):
                    filepath = test_path
                    break
            # Try matching partial name
            if not os.path.exists(filepath):
                for f in os.listdir(UPLOAD_DIR):
                    if filename in f:
                        filepath = os.path.join(UPLOAD_DIR, f)
                        break
        
        if not os.path.exists(filepath):
            return JSONResponse(status_code=404, content={"error": f"File not found: {filename}"})
        
        # Load the file
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Create Excel output
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='data', index=False)
        output.seek(0)
        
        # Clean filename for download
        clean_name = filename.split('/')[-1].replace('.csv', '').replace('.xlsx', '')
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={clean_name}.xlsx"}
        )
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/list")
async def list_files():
    """List all uploaded/generated files"""
    try:
        files = []
        if os.path.exists(UPLOAD_DIR):
            for f in os.listdir(UPLOAD_DIR):
                if f.endswith(('.xlsx', '.csv', '.xls')):
                    filepath = os.path.join(UPLOAD_DIR, f)
                    files.append({
                        "name": f,
                        "size": os.path.getsize(filepath),
                        "url": f"http://localhost:8000/files/{f}"
                    })
        return {"files": files}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
