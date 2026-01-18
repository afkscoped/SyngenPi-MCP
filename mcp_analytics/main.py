
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="MCP Analytics")

class SAMRequest(BaseModel):
    dataset_id: str
    sheet: str
    test: str
    params: dict

@app.get("/")
def health():
    return {"status": "ok", "service": "mcp_analytics"}

@app.post("/run_test")
def run_test(req: SAMRequest):
    from sam_core import SAMCore
    sam = SAMCore()
    # In real app, we load df via req.dataset_id
    result = sam.run_test(req.test, req.params)
    return {"status": "success", "results": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
