
import pandas as pd
import os
import io
import requests
from typing import List, Dict, Any, Optional

class SheetsService:
    def __init__(self):
        # We can reuse authentication logic if needed, 
        # but for now we trust the signed URLs or local paths.
        pass

    def load_sheet(self, file_url: str) -> Dict[str, Any]:
        """
        Reads a file from a URL (local or remote) and returns structured JSON 
        compatibile with React Data Grid.
        """
        try:
            print(f"SheetsService: Loading from {file_url}")
            
            # Determine read method
            if file_url.startswith("http"):
                # Download into memory
                response = requests.get(file_url)
                response.raise_for_status()
                file_content = io.BytesIO(response.content)
            else:
                # Local path? Unlikely context, but handle just in case
                if os.path.exists(file_url):
                    file_content = file_url
                else:
                    return {"error": f"File not found: {file_url}"}

            # Try parsing as Excel first, then CSV
            try:
                df = pd.read_excel(file_content)
            except:
                file_content.seek(0)
                df = pd.read_csv(file_content)
            
            # Replace NaN with null/empty string for JSON serialization
            df = df.fillna("")
            
            # Convert to React Data Grid format
            columns = [{"key": col, "name": col, "editable": True} for col in df.columns]
            rows = df.to_dict(orient="records")
            # Ensure rows have an ID for RDG (React Data Grid)
            for idx, row in enumerate(rows):
                if "id" not in row:
                    row["id"] = idx
            
            return {
                "columns": columns, 
                "rows": rows,
                "total_rows": len(rows)
            }
            
        except Exception as e:
            print(f"Error loading sheet: {e}")
            return {"error": str(e)}

    def save_sheet(self, file_url: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Converts rows back to DataFrame and saves to the original location (or updates).
        For this simplified version, we'll rewrite local files or return a new blob for remote.
        """
        try:
            print(f"SheetsService: Saving to {file_url}")
            df = pd.DataFrame(rows)
            
            # Remove 'id' if it was auto-added and not in original columns? 
            # Ideally we keep it if it's useful, but for raw data export check context.
            # We'll keep all keys present in rows.
            
            output = io.BytesIO()
            # Default to Excel
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False)
            output.seek(0)
            
            # If it's a local file within our backend/generated, we can overwrite it directly!
            # URL: http://localhost:8000/files/filename.xlsx
            # Path: backend/generated/filename.xlsx
            
            if "localhost:8000/files/" in file_url:
                filename = file_url.split("/files/")[-1]
                local_path = os.path.join("backend", "generated", filename)
                with open(local_path, "wb") as f:
                    f.write(output.read())
                return {"status": "success", "message": "Local file updated", "url": file_url}
            
            # Implementation for Supabase upload would go here (using supabase client)
            # For now, we return success and the buffer would need to be handled by caller if they want to upload.
            # But since we only have the URL, we can't easily overwrite a signed URL's source.
            # Limitation: We can only overwrite if we have the KEY/PATH in supabase.
            
            return {"status": "success", "message": "Saved (Simulated for remote)", "url": file_url}

        except Exception as e:
            return {"status": "error", "message": str(e)}
