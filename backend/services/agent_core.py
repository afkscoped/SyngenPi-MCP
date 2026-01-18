import os
import json
import re
from typing import Optional

class AgentCore:
    """Agent for parsing natural language commands using Groq API."""
    
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.client = None
        
        if self.api_key and self.api_key != "YOUR_GROQ_API_KEY_HERE":
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except ImportError:
                print("Warning: groq package not installed. Run: pip install groq")
            except Exception as e:
                print(f"Warning: Failed to initialize Groq client: {e}")
        else:
            print("Warning: GROQ_API_KEY not found. AI features will use fallback mode.")

    def parse_stat_command(self, command: str, columns: dict, sample_data: str) -> dict:
        """Parse a natural language command into a structured test specification."""
        
        # Fallback if no LLM configured
        if not self.client:
            return self._fallback_parse(command, columns)
        
        prompt = f"""You are a statistical assistant. Map the user command to a statistical test.
Allowed tests: [t-test, paired-t, anova, pearson, linreg, chi2]

User Input: {command}
Dataset Columns: {json.dumps(columns)}
Sample Data: {sample_data[:500] if sample_data else 'N/A'}

Return ONLY a JSON object (no markdown):
{{"test": "name", "params": {{"key": "col_name"}}, "clarify": null}}"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=500
            )
            content = response.choices[0].message.content.strip()
            
            # Remove markdown fences if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)
        except json.JSONDecodeError as e:
            return {"error": f"Failed to parse LLM response as JSON: {e}"}
        except Exception as e:
            return {"error": f"LLM call failed: {e}"}

    def _fallback_parse(self, command: str, columns: dict) -> dict:
        """Simple rule-based fallback when no LLM is available."""
        command_lower = command.lower()
        cols = list(columns.keys()) if columns else []
        
        if "t-test" in command_lower or "compare" in command_lower:
            return {
                "test": "t-test",
                "params": {"group_col": cols[0] if cols else "group", "value_col": cols[1] if len(cols) > 1 else "value"},
                "clarify": None
            }
        elif "correlation" in command_lower or "pearson" in command_lower:
            return {
                "test": "pearson",
                "params": {"col1": cols[0] if cols else "x", "col2": cols[1] if len(cols) > 1 else "y"},
                "clarify": None
            }
        elif "regression" in command_lower or "predict" in command_lower:
            return {
                "test": "linreg",
                "params": {"target_col": cols[-1] if cols else "target", "feature_cols": cols[:-1] if len(cols) > 1 else ["feature"]},
                "clarify": None
            }
        else:
            return {
                "test": "t-test",
                "params": {"group_col": cols[0] if cols else "group", "value_col": cols[1] if len(cols) > 1 else "value"},
                "clarify": "I assumed you want a t-test. Specify the test type for better results."
            }

    def explain_result(self, result_json: dict) -> str:
        """Generate a human-readable explanation of statistical results."""
        if not self.client:
            return self._fallback_explain(result_json)
        
        try:
            prompt = f"""Explain this statistical result in plain English for a business user.
Focus on practical significance. Keep it short (2-3 sentences).
Result: {json.dumps(result_json)}"""

            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=300
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return self._fallback_explain(result_json)

    def _fallback_explain(self, result_json: dict) -> str:
        """Rule-based explanation when no LLM is available."""
        p_value = result_json.get("p_value")
        if p_value is not None:
            if p_value < 0.05:
                return f"The result is statistically significant (p={p_value:.4f}). There is strong evidence of a real effect."
            else:
                return f"The result is not statistically significant (p={p_value:.4f}). The observed difference could be due to chance."
        return "Analysis complete. Review the metrics above for insights."

    def execute(self, command: str, context: str = "") -> dict:
        """Execute a command and return parsed intent."""
        columns = {}
        if context:
            # Try to extract column names from context
            try:
                lines = context.split('\n')
                if lines:
                    columns = {c.strip(): "unknown" for c in lines[0].split(',') if c.strip()}
            except:
                pass
        
        return self.parse_stat_command(command, columns, context)
