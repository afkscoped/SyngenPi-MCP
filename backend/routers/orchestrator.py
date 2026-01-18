
from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.graph import OrchestratorCore  # Renaming likely needed or import adjustment

# Ensure graph.py has OrchestratorCore
try:
    from backend.services.graph import OrchestratorCore
except ImportError:
    # If not defined in graph.py yet, we mock or expect it to be there from the move
    pass

router = APIRouter(prefix="/orchestrator", tags=["Orchestrator"])

class PlanRequest(BaseModel):
    input: str

@router.post("/plan")
def create_plan(req: PlanRequest):
    core = OrchestratorCore()
    result = core.run(req.input)
    return result
