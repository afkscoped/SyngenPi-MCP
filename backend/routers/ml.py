
import os
import io
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from supabase import create_client, Client
from backend.config import UPLOAD_DIR

# Try Import AutoGluon
try:
    from autogluon.tabular import TabularPredictor
    AUTOGLUON_AVAILABLE = True
except ImportError:
    AUTOGLUON_AVAILABLE = False
    from backend.ml.fallback_sklearn import FallbackPredictor

router = APIRouter(prefix="/ml", tags=["machine_learning"])

# Supabase init (should probably be a shared dependency)
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Optional[Client] = create_client(url, key) if url and key else None

class TrainRequest(BaseModel):
    dataset_id: str
    target: str
    sheet: str = "data"
    time_limit: int = 60
    presets: str = "medium_quality"
    eval_dataset_id: Optional[str] = None

class PredictRequest(BaseModel):
    model_id: str
    dataset_id: str
    sheet: str = "data"

@router.post("/train")
def train_model(req: TrainRequest):
    # 1. Load Data from file path or URL
    df = None
    
    # Check if dataset_id is a local path
    if req.dataset_id.startswith("http"):
        # It's a URL, extract filename and load from generated/
        filename = req.dataset_id.split("/")[-1]
        filepath = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(filepath):
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
    elif os.path.exists(os.path.join(UPLOAD_DIR, req.dataset_id)):
        filepath = os.path.join(UPLOAD_DIR, req.dataset_id)
        if req.dataset_id.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
    
    # Fallback to mock data if file not found
    if df is None:
        print(f"Warning: Could not load {req.dataset_id}, using mock data")
        df = pd.DataFrame({
            "A": range(100),
            "B": range(100, 200),
            "target": [1 if x > 150 else 0 for x in range(100, 200)]
        })
    
    # Validate target column exists
    if req.target not in df.columns:
        return {"error": f"Target column '{req.target}' not found. Available: {list(df.columns)}"}
    
    
    model_id = f"model_{req.dataset_id}_{req.target}"
    save_path = f"models/{model_id}"
    
    if AUTOGLUON_AVAILABLE:
        print(f"Training with AutoGluon (limit={req.time_limit}s)...")
        predictor = TabularPredictor(label=req.target, path=save_path).fit(
            train_data=df,
            time_limit=req.time_limit,
            presets=req.presets,
            verbosity=2
        )
        leaderboard = predictor.leaderboard(silent=True)
        metrics = leaderboard.iloc[0].to_dict()
    else:
        print("AutoGluon not found. Using Fallback.")
        predictor = FallbackPredictor(target=req.target)
        metrics = predictor.fit(df, time_limit=req.time_limit)
        # Mock saving
        os.makedirs("models", exist_ok=True)
        predictor.save(f"models/{model_id}.pkl")

    return {
        "model_id": model_id,
        "fallback": not AUTOGLUON_AVAILABLE,
        "metrics": metrics,
        "message": "Training complete"
    }

@router.post("/predict")
def predict_model(req: PredictRequest):
    model_id = req.model_id
    # Mock Data load
    df = pd.DataFrame({"A": range(10), "B": range(100, 110)})
    
    if AUTOGLUON_AVAILABLE:
        predictor = TabularPredictor.load(f"models/{model_id}")
        preds = predictor.predict(df)
    else:
        try:
             predictor = FallbackPredictor.load(f"models/{model_id}.pkl")
             preds = predictor.predict(df)
        except Exception:
             return {"error": "Model not found"}
             
    return {
        "predictions": preds.tolist()[:10], # Return first 10 for preview
        "count": len(preds)
    }
