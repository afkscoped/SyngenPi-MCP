
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import pandas as pd
import numpy as np
import io
import os
import traceback

router = APIRouter(prefix="/meta", tags=["meta-scientist"])

# Local storage fallback
LOCAL_META_DIR = "backend/generated/meta"
os.makedirs(LOCAL_META_DIR, exist_ok=True)

class PrepareRequest(BaseModel):
    files: List[str]
    mapping: Optional[Dict[str, str]] = None

class RunRequest(BaseModel):
    summaries: List[Dict[str, Any]]
    method: str = "random"

class ABTestRequest(BaseModel):
    files: List[str]
    metric_col: str
    group_col: str = "group"

class KaggleRequest(BaseModel):
    dataset: str
    n_studies: int = 10
    seed: int = 42

class SyngenRequest(BaseModel):
    n_studies: int = 10
    domain: str = "saas"
    effect_size: float = 0.05
    heterogeneity: float = 0.01

@router.post("/upload")
async def upload_experiments(files: List[UploadFile] = File(...)):
    """Upload experiment files locally"""
    uploaded = []
    
    for f in files:
        try:
            contents = await f.read()
            filename = f"{pd.Timestamp.now().strftime('%Y%m%d%H%M%S')}_{f.filename}"
            filepath = os.path.join(LOCAL_META_DIR, filename)
            
            with open(filepath, "wb") as out:
                out.write(contents)
            
            uploaded.append({
                "file_id": filename,
                "filename": f.filename,
                "url": f"http://localhost:8000/files/meta/{filename}"
            })
        except Exception as e:
            uploaded.append({"error": str(e), "filename": f.filename})
    
    return {"uploaded": uploaded, "count": len(uploaded)}

@router.post("/prepare")
def prepare_summaries(req: PrepareRequest):
    """Prepare effect sizes from uploaded files"""
    summaries = []
    
    for file_id in req.files:
        try:
            # Try local file first
            filepath = os.path.join(LOCAL_META_DIR, file_id)
            if not os.path.exists(filepath):
                filepath = os.path.join("backend/generated", file_id)
            
            if not os.path.exists(filepath):
                summaries.append({"study_id": file_id, "error": "File not found"})
                continue
            
            # Read file
            if filepath.endswith(".csv"):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Auto-detect columns
            treat_col = req.mapping.get("treatment_col") if req.mapping else None
            outcome_col = req.mapping.get("outcome_col") if req.mapping else None
            
            if not treat_col:
                for c in df.columns:
                    if c.lower() in ['group', 'arm', 'variant', 'test', 'treatment']:
                        treat_col = c
                        break
            
            if not outcome_col:
                for c in df.columns:
                    if c.lower() in ['score', 'value', 'conversion', 'revenue', 'result', 'outcome']:
                        outcome_col = c
                        break
            
            if not treat_col or not outcome_col:
                summaries.append({
                    "study_id": file_id,
                    "error": f"Could not auto-detect columns. Available: {list(df.columns)}"
                })
                continue
            
            # Compute effect size (mean difference / pooled SD)
            groups = df[treat_col].unique()
            if len(groups) < 2:
                summaries.append({"study_id": file_id, "error": "Need at least 2 groups"})
                continue
            
            g1 = df[df[treat_col] == groups[0]][outcome_col].dropna()
            g2 = df[df[treat_col] == groups[1]][outcome_col].dropna()
            
            # Cohen's d
            pooled_std = np.sqrt(((len(g1)-1)*g1.std()**2 + (len(g2)-1)*g2.std()**2) / (len(g1)+len(g2)-2))
            effect_size = (g2.mean() - g1.mean()) / pooled_std if pooled_std > 0 else 0
            std_error = np.sqrt(1/len(g1) + 1/len(g2)) * np.sqrt((len(g1)+len(g2))/(len(g1)+len(g2)-2))
            
            summaries.append({
                "study_id": file_id.split('_')[-1].replace('.csv', '').replace('.xlsx', ''),
                "effect_size": float(effect_size),
                "std_error": float(std_error),
                "n_t": int(len(g2)),
                "n_c": int(len(g1)),
                "mean_t": float(g2.mean()),
                "mean_c": float(g1.mean())
            })
            
        except Exception as e:
            traceback.print_exc()
            summaries.append({"study_id": file_id, "error": str(e)})
    
    return {"status": "success", "summaries": summaries}

@router.post("/ab-test")
def run_ab_test(req: ABTestRequest):
    """Run A/B test on multiple files"""
    from scipy import stats
    
    results = []
    combined_control = []
    combined_treatment = []
    
    for file_id in req.files:
        try:
            filepath = os.path.join(LOCAL_META_DIR, file_id)
            if not os.path.exists(filepath):
                filepath = os.path.join("backend/generated", file_id)
            
            if filepath.endswith(".csv"):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            groups = df[req.group_col].unique()
            if len(groups) < 2:
                continue
            
            g1 = df[df[req.group_col] == groups[0]][req.metric_col].dropna()
            g2 = df[df[req.group_col] == groups[1]][req.metric_col].dropna()
            
            # T-test
            t_stat, p_val = stats.ttest_ind(g1, g2, equal_var=False)
            
            results.append({
                "file": file_id,
                "control_mean": float(g1.mean()),
                "treatment_mean": float(g2.mean()),
                "lift": float((g2.mean() - g1.mean()) / g1.mean() * 100) if g1.mean() != 0 else 0,
                "t_stat": float(t_stat),
                "p_value": float(p_val),
                "significant": p_val < 0.05
            })
            
            combined_control.extend(g1.tolist())
            combined_treatment.extend(g2.tolist())
            
        except Exception as e:
            results.append({"file": file_id, "error": str(e)})
    
    # Aggregate test
    aggregate = None
    if combined_control and combined_treatment:
        t_stat, p_val = stats.ttest_ind(combined_control, combined_treatment, equal_var=False)
        aggregate = {
            "control_mean": float(np.mean(combined_control)),
            "treatment_mean": float(np.mean(combined_treatment)),
            "lift": float((np.mean(combined_treatment) - np.mean(combined_control)) / np.mean(combined_control) * 100),
            "t_stat": float(t_stat),
            "p_value": float(p_val),
            "significant": p_val < 0.05,
            "n_control": len(combined_control),
            "n_treatment": len(combined_treatment)
        }
    
    return {"individual_results": results, "aggregate": aggregate}

@router.post("/run")
def run_meta_analysis(req: RunRequest):
    """Run meta-analysis on prepared summaries"""
    try:
        from backend.services.meta_core import MetaCore
        
        valid = [s for s in req.summaries if "error" not in s and "effect_size" in s]
        if not valid:
            return JSONResponse(status_code=400, content={"error": "No valid summaries"})
        
        meta_service = MetaCore()
        result = meta_service.run_analysis(valid, method=req.method)
        return result
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/kaggle")
def run_kaggle_pipeline(req: KaggleRequest):
    """Run meta-analysis on Kaggle dataset"""
    try:
        from backend.services.kaggle_service import KaggleService
        from backend.services.meta_core import MetaCore
        
        kaggle_service = KaggleService()
        meta_service = MetaCore()
        
        summaries = kaggle_service.ingest_and_split(req.dataset, req.n_studies, req.seed)
        if not summaries:
            return JSONResponse(status_code=404, content={"error": "No summaries generated"})
        
        result = meta_service.run_analysis(summaries, method="random")
        result["summaries"] = summaries
        return result
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/syngen")
def run_syngen_pipeline(req: SyngenRequest):
    """Generate synthetic studies and run meta-analysis"""
    try:
        from backend.services.syngen_loop import SyngenLoop
        from backend.services.meta_core import MetaCore
        
        syngen_loop_service = SyngenLoop()
        meta_service = MetaCore()
        
        summaries = syngen_loop_service.generate_batch(
            n_studies=req.n_studies,
            domain=req.domain,
            effect_size_target=req.effect_size,
            heterogeneity=req.heterogeneity
        )
        
        result = meta_service.run_analysis(summaries, method="random")
        result["summaries"] = summaries
        return result
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/files")
def list_meta_files():
    """List uploaded meta-analysis files"""
    files = []
    if os.path.exists(LOCAL_META_DIR):
        for f in os.listdir(LOCAL_META_DIR):
            filepath = os.path.join(LOCAL_META_DIR, f)
            files.append({
                "name": f,
                "size": os.path.getsize(filepath),
                "url": f"http://localhost:8000/files/meta/{f}"
            })
    return {"files": files}
