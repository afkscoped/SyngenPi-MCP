
import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

# Mock State
class AgentState(TypedDict):
    input: str
    plan: List[str]
    current_step: int
    results: List[str]

class OrchestratorCore:
    def __init__(self):
        key = os.environ.get("OPENAI_API_KEY")
        self.llm = ChatOpenAI(model="gpt-4o", api_key=key) if key else None
        self.graph = self._build_graph()

    def _planner(self, state: AgentState):
        if not self.llm:
            return {"plan": ["mock_step_1", "mock_step_2"]}
            
        messages = [
            SystemMessage(content="You are a data assistant. Return a list of execution steps."),
            HumanMessage(content=state["input"])
        ]
        # Simplified: In real app, we parse JSON plan
        return {"plan": ["step1", "step2"]}

    def _executor(self, state: AgentState):
        step = state["plan"][state["current_step"]]
        # Execute step via calling other microservices (mcp_sheets, etc)
        # For now just mock return
        return {"results": [f"Executed {step}"], "current_step": state["current_step"] + 1}

    def _build_graph(self):
        workflow = StateGraph(AgentState)
        workflow.add_node("planner", self._planner)
        workflow.add_node("executor", self._executor)
        
        workflow.set_entry_point("planner")
        workflow.add_edge("planner", "executor")
        workflow.add_edge("executor", END) 
        
        return workflow.compile()

    def run(self, user_input: str):
        initial = {"input": user_input, "plan": [], "current_step": 0, "results": []}
        final = self.graph.invoke(initial)
        return final
