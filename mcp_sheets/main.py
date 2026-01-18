
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="MCP Sheets")

class AgentRequest(BaseModel):
    dataset_id: str
    sheet_name: str
    command: str
    user_id: str

@app.get("/")
def health():
    return {"status": "ok", "service": "mcp_sheets"}

@app.post("/execute_agent")
def execute_agent(req: AgentRequest):
    from agent_core import AgentCore
    core = AgentCore()
    # Mocking preview data for now
    preview = "Column A: [1, 2, None], Column B: ['x', 'y', 'z']"
    result = core.execute(req.command, preview)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
