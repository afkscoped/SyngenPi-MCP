"""
Analytics Router - Fixed with proper JSON error handling
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import os
import traceback
from backend.config import UPLOAD_DIR

router = APIRouter(prefix="/analytics", tags=["analytics"])

class RunTestRequest(BaseModel):
    dataset_id: str
    sheet: str = "data"
    test: str
    params: Dict[str, Any]

class AgentRequest(BaseModel):
    dataset_id: str
    command: str
    sheet: str = "data"

def load_dataframe(dataset_id: str) -> Optional[pd.DataFrame]:
    """Load a DataFrame from dataset_id"""
    try:
        if dataset_id.startswith("http"):
            filename = dataset_id.split("/")[-1]
        else:
            filename = dataset_id
        
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        if not os.path.exists(filepath):
            # Try matching partial name
            for f in os.listdir(UPLOAD_DIR):
                if filename in f:
                    filepath = os.path.join(UPLOAD_DIR, f)
                    break
        
        if os.path.exists(filepath):
            if filepath.endswith('.csv'):
                return pd.read_csv(filepath)
            else:
                return pd.read_excel(filepath)
    except Exception as e:
        print(f"Error loading dataframe: {e}")
    return None

def run_statistical_test(test: str, params: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
    """Run a statistical test on the dataframe"""
    from scipy import stats
    
    try:
        if test == "t-test":
            group_col = params.get("group_col")
            value_col = params.get("value_col")
            
            if not group_col or not value_col:
                return {"error": "t-test requires group_col and value_col parameters"}
            
            if group_col not in df.columns or value_col not in df.columns:
                return {"error": f"Columns not found. Available: {list(df.columns)}"}
            
            groups = df[group_col].unique()
            if len(groups) < 2:
                return {"error": "Need at least 2 groups for t-test"}
            
            g1 = df[df[group_col] == groups[0]][value_col].dropna()
            g2 = df[df[group_col] == groups[1]][value_col].dropna()
            
            t_stat, p_val = stats.ttest_ind(g1, g2, equal_var=False)
            
            return {
                "test": "t-test",
                "t_statistic": float(t_stat),
                "p_value": float(p_val),
                "group1_mean": float(g1.mean()),
                "group2_mean": float(g2.mean()),
                "significant": p_val < 0.05,
                "meaning": f"The difference between groups is {'statistically significant' if p_val < 0.05 else 'not statistically significant'} (p={p_val:.4f})"
            }
            
        elif test == "pearson":
            col1 = params.get("col1")
            col2 = params.get("col2")
            
            if not col1 or not col2:
                return {"error": "Pearson requires col1 and col2 parameters"}
            
            r, p_val = stats.pearsonr(df[col1].dropna(), df[col2].dropna())
            
            return {
                "test": "pearson",
                "correlation": float(r),
                "p_value": float(p_val),
                "significant": p_val < 0.05,
                "meaning": f"{'Strong' if abs(r) > 0.7 else 'Moderate' if abs(r) > 0.4 else 'Weak'} {'positive' if r > 0 else 'negative'} correlation (r={r:.3f})"
            }
            
        elif test == "anova":
            group_col = params.get("group_col")
            value_col = params.get("value_col")
            
            groups = [g[value_col].dropna() for name, g in df.groupby(group_col)]
            f_stat, p_val = stats.f_oneway(*groups)
            
            return {
                "test": "anova",
                "f_statistic": float(f_stat),
                "p_value": float(p_val),
                "significant": p_val < 0.05
            }

        elif test == "linreg":
            target = params.get("target_col")
            features = params.get("feature_cols")
            
            if not target or not features:
                return {"error": "Regression requires target_col and feature_cols"}
            
            # Simple linear regression with 1 feature for now (scipy stats linregress)
            # Or use statsmodels/sklearn for multiple. Let's stick to simple 1v1 for robustness without extra deps if possible.
            # But the agent might pass multiple features.
            
            # Use single feature if list provided
            feature = features[0] if isinstance(features, list) else features
            
            slope, intercept, r_value, p_value, std_err = stats.linregress(df[feature], df[target])
            
            return {
                "test": "linreg",
                "slope": float(slope),
                "intercept": float(intercept),
                "r_squared": float(r_value**2),
                "p_value": float(p_value),
                "significant": p_value < 0.05
            }

        elif test == "chi2":
            col1 = params.get("col1")
            col2 = params.get("col2")
            
            contingency_table = pd.crosstab(df[col1], df[col2])
            chi2, p, dof, expected = stats.chi2_contingency(contingency_table)
            
            return {
                "test": "chi2",
                "chi2_statistic": float(chi2),
                "p_value": float(p),
                "dof": int(dof),
                "significant": p < 0.05
            }
        
        else:
            return {"error": f"Unknown test: {test}"}
            
    except Exception as e:
        return {"error": str(e)}

@router.post("/run")
async def run_analytics(req: RunTestRequest):
    """Run a statistical test"""
    try:
        df = load_dataframe(req.dataset_id)
        if df is None:
            return JSONResponse(
                status_code=400,
                content={"error": f"Could not load dataset: {req.dataset_id}"}
            )
        
        result = run_statistical_test(req.test, req.params, df)
        
        if "error" in result:
            return JSONResponse(status_code=400, content=result)
        
        return {"status": "success", "results": result}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/agent")
async def run_agent(req: AgentRequest):
    """Parse natural language command and run analysis"""
    try:
        from backend.services.agent_core import AgentCore
        
        df = load_dataframe(req.dataset_id)
        
        if df is None:
            return JSONResponse(
                status_code=400,
                content={"error": f"Could not load dataset: {req.dataset_id}"}
            )
        
        columns = {c: str(df[c].dtype) for c in df.columns}
        sample_data = df.head(3).to_string()
        
        agent = AgentCore()
        plan = agent.parse_stat_command(req.command, columns, sample_data)
        
        if plan.get("error"):
            return {"status": "error", "plan": plan, "message": plan["error"]}
        
        # Run the test if we got a valid plan
        if plan.get("test"):
            result = run_statistical_test(plan["test"], plan.get("params", {}), df)
            return {"status": "success", "plan": plan, "results": result}
        
        return {"status": "parsed", "plan": plan}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/explain")
async def explain_result(results: Dict[str, Any]):
    """Explain statistical results"""
    try:
        from backend.services.agent_core import AgentCore
        agent = AgentCore()
        explanation = agent.explain_result(results)
        return {"explanation": explanation}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
