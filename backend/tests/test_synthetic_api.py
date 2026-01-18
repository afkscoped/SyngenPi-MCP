import requests
import time
import os

BASE_URL = "http://localhost:8000"

def test_health():
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {r.status_code} - {r.json()}")
        assert r.status_code == 200
    except Exception as e:
        print(f"Health Check Failed: {e}")
        exit(1)

def test_generate_synthetic():
    print("Testing /synthetic/generate...")
    payload = {
        "domain": "finance",
        "rows": 10,
        "privacy_level": "low"
    }
    
    start = time.time()
    r = requests.post(f"{BASE_URL}/synthetic/generate", json=payload)
    print(f"Response ({r.status_code}): {r.text[:200]}...")
    
    assert r.status_code == 200, f"Failed: {r.text}"
    data = r.json()
    assert data["status"] == "success"
    assert "file_url" in data
    
    file_url = data["file_url"]
    print(f"Generated File URL: {file_url}")
    
    # Check if file is downloadable
    # If URL is signed Supabase, we might not be able to verify easily without token? 
    # Actually public/signed URLs should be downloadable by anyone.
    f_res = requests.head(file_url)
    if f_res.status_code != 200:
        # Retry with GET
        f_res = requests.get(file_url, stream=True)
    
    print(f"File Download Check: {f_res.status_code}")
    assert f_res.status_code == 200, "Could not download generated file"
    print("Test Passed!")

if __name__ == "__main__":
    test_health()
    test_generate_synthetic()
