import requests
import pandas as pd
import os
import time

BASE_URL = "http://localhost:8000"
GENERATED_DIR = "backend/generated"

def test_sheets_api():
    print("Testing /sheets API...")
    
    # 1. Create a dummy file locally
    filename = "test_sheet.xlsx"
    filepath = os.path.join(GENERATED_DIR, filename)
    os.makedirs(GENERATED_DIR, exist_ok=True)
    
    df = pd.DataFrame([{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}])
    df.to_excel(filepath, index=False)
    
    file_url = f"{BASE_URL}/files/{filename}"
    print(f"Created dummy file: {file_url}")
    
    # 2. Test Load
    print("Testing /load...")
    r = requests.post(f"{BASE_URL}/sheets/load", json={"url": file_url})
    assert r.status_code == 200, f"Load failed: {r.text}"
    data = r.json()
    print("Load Response:", data)
    assert len(data["rows"]) == 2
    assert data["rows"][0]["name"] == "Alice"
    
    # 3. Test Save
    print("Testing /save...")
    # Modify data
    new_rows = data["rows"]
    new_rows.append({"id": 3, "name": "Charlie"})
    
    r = requests.post(f"{BASE_URL}/sheets/save", json={"url": file_url, "rows": new_rows})
    assert r.status_code == 200, f"Save failed: {r.text}"
    print("Save Response:", r.json())
    
    # 4. Verify on disk
    df_new = pd.read_excel(filepath)
    print("Disk verification:", df_new.to_dict(orient="records"))
    assert len(df_new) == 3
    assert df_new.iloc[2]["name"] == "Charlie"
    
    print("Sheets API passed!")

if __name__ == "__main__":
    # Wait for server if needed
    time.sleep(2)
    test_sheets_api()
