
import os
import json
import pandas as pd
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
# from e2b_code_interpreter import CodeInterpreter # Uncomment when installed
# Note: E2B requires an API key. We will write mock logic if imports fail for scaffold.

class AgentCore:
    def __init__(self):
        self.openai_key = os.environ.get("OPENAI_API_KEY")
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0, api_key=self.openai_key) if self.openai_key else None

    def execute(self, command: str, sheet_data_preview: str):
        if not self.llm:
            return {"status": "error", "message": "Missing OpenAI API Key"}

        # 1. Plan: NLP -> Python/JSON
        # We ask for a JSON plan of atomic operations as per prompt requirements
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a safe spreadsheet agent. 
            Allowed atomic operations: delete_column(index|name), rename_column(old, new), fill_na(column, method), compute_column(new_col, expr). 
            Output must be strict JSON: {{"ops":[{{"op":"op_name", ...}}]}}. 
            Do not output any prose."""),
            ("user", "Context: {preview}\nCommand: {command}")
        ])
        
        chain = prompt | self.llm
        try:
            response = chain.invoke({"preview": sheet_data_preview, "command": command})
            plan_json = response.content.replace("```json", "").replace("```", "").strip()
            plan = json.loads(plan_json)
        except Exception as e:
            return {"status": "error", "message": f"Planning failed: {e}"}

        # 2. Execute in Sandbox (Mock for now, replacing with E2B logic in production)
        # In real impl, we would spin up E2B CodeInterpreter, upload the file, run pandas code, download result.
        
        # Generating the Python code from the plan
        ops = plan.get("ops", [])
        python_code = "import pandas as pd\n# Mock load\ndf = pd.DataFrame()\n"
        for op in ops:
            if op["op"] == "delete_column":
                col = op.get("name") or op.get("value")
                python_code += f"if '{col}' in df.columns: df.drop(columns=['{col}'], inplace=True)\n"
            elif op["op"] == "fill_na":
                col = op.get("column")
                method = op.get("method", "mean") # simple handling
                python_code += f"if '{col}' in df.columns: df['{col}'] = df['{col}'].fillna(df['{col}'].mean())\n"
        
        # Executing... (Mock)
        print(f"Executing Sandbox Code:\n{python_code}")
        
        return {
            "status": "success",
            "plan": plan,
            "executed_code": python_code,
            "diff_summary": f"Executed {len(ops)} operations."
        }

