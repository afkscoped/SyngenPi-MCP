
from fastapi import FastAPI, HTTPException
import os
from pydantic import BaseModel

app = FastAPI(title="MCP Synthetic")

class GenerateRequest(BaseModel):
    dataset_id: str
    sheet: str = "data"
    domain: str = "general"
    rows: int = 100
    seed: int | None = None
    privacy_level: str = "medium"

@app.get("/")
def health():
    return {"status": "ok", "service": "mcp_synthetic"}

@app.post("/generate")
def generate_data(req: GenerateRequest):
    from syngen_core import SyngenCore
    engine = SyngenCore()
    result = engine.generate(
        dataset_id=req.dataset_id,
        rows=req.rows,
        domain=req.domain,
        seed=req.seed,
        privacy_level=req.privacy_level
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
