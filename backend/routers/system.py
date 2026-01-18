from fastapi import APIRouter, HTTPException
import os
import logging
from typing import Dict, Any

router = APIRouter(tags=["system"])

@router.get("/health")
def health_check() -> Dict[str, Any]:
    """
    Returns the health status of the system and its dependencies.
    """
    # Check Supabase Connection (Basic env check for now)
    supabase_status = "configured" if os.environ.get("SUPABASE_URL") else "missing_env"
    
    return {
        "status": "ok",
        "version": "1.0.0",
        "services": {
            "api": "running",
            "supabase": supabase_status,
            # Add E2B or other checks here later
        }
    }

@router.get("/debug/logs")
def get_logs(tail: int = 100):
    """
    Returns the last 'tail' lines of the debug log.
    Only allows reading the specific 'backend_debug.log' file.
    """
    log_file = os.path.join(os.getcwd(), "backend_debug.log")
    if not os.path.exists(log_file):
        return {"logs": ["Log file not found."]}
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            return {"logs": lines[-tail:]}
    except Exception as e:
        return {"error": str(e)}

@router.get("/files")
def list_files():
    """
    Lists all generated files in the local storage directory.
    Returns: { "files": [ { "name": str, "url": str, "size": str, "created": str } ] }
    """
    directory = os.path.join(os.getcwd(), "backend", "generated")
    if not os.path.exists(directory):
        return {"files": []}
        
    files_list = []
    base_url = "http://localhost:8000/files" # Fallback if unknown host
    
    try:
        # Sort by modification time (newest first)
        with os.scandir(directory) as entries:
            # Filter for files only
            files = [e for e in entries if e.is_file()]
            files.sort(key=lambda e: e.stat().st_mtime, reverse=True)
            
            for entry in files:
                size_kb = round(entry.stat().st_size / 1024, 1)
                from datetime import datetime
                created_str = datetime.fromtimestamp(entry.stat().st_mtime).strftime('%Y-%m-%d %H:%M')
                
                files_list.append({
                    "name": entry.name,
                    "url": f"{base_url}/{entry.name}",
                    "size": f"{size_kb} KB",
                    "created": created_str
                })
                
        return {"files": files_list}
    except Exception as e:
        return {"error": f"Failed to scan files: {str(e)}"}
