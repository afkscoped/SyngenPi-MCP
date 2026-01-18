
from fastapi import FastAPI

app = FastAPI(title="Orchestrator")

@app.get("/")
def health():
    return {"status": "ok", "service": "orchestrator"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
