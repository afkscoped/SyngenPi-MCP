import requests
import time

BASE_URL = "http://localhost:8000"

def test_ml_train():
    print("Testing /ml/train...")
    payload = {
        "dataset_id": "test_ds",
        "target": "target",
        "time_limit": 5 # Short for test
    }
    r = requests.post(f"{BASE_URL}/ml/train", json=payload)
    if r.status_code != 200:
        print(f"Train Failed: {r.text}")
        return False
        
    data = r.json()
    print("Train Result:", data)
    assert "model_id" in data
    assert "metrics" in data
    return data["model_id"]

def test_ml_predict(model_id):
    print("Testing /ml/predict...")
    payload = {
        "model_id": model_id,
        "dataset_id": "test_ds"
    }
    r = requests.post(f"{BASE_URL}/ml/predict", json=payload)
    if r.status_code != 200:
        print(f"Predict Failed: {r.text}")
        return False
    
    data = r.json()
    print("Predict Result (First 5):", data["predictions"][:5])
    assert len(data["predictions"]) > 0

def test_agent_command():
    print("Testing /sheets/command (Agent)...")
    columns = {"age": "int", "income": "float", "group": "string"}
    
    # Needs a way to pass columns? The router code for /sheets/command mocks preview or takes it.
    # Looking at agent_core, it uses LLM.
    # If LLM key is missing, it returns error or warning.
    
    payload = {
        "dataset_id": "test_ds",
        "sheet_name": "data",
        "command": "Compare income by group using t-test",
        "user_id": "test_user"
    }
    r = requests.post(f"{BASE_URL}/sheets/command", json=payload)
    print(f"Agent Response: {r.text}")
    # We expect either a parsed JSON or an error if keys are missing, but 200 OK HTTP.
    assert r.status_code == 200

if __name__ == "__main__":
    time.sleep(2) # Wait for startup
    model_id = test_ml_train()
    if model_id:
        test_ml_predict(model_id)
    test_agent_command()
