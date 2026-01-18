
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

def compute_summary_from_df(df: pd.DataFrame, 
                            treat_col: str, 
                            outcome_col: str, 
                            treat_val: Any = None, 
                            outcome_type: str = 'auto') -> Dict[str, Any]:
    
    # 1. auto-detect treatment value if not provided
    if treat_val is None:
        # Assume minority or smaller value or string like 'treatment'
        uniques = df[treat_col].unique()
        if len(uniques) != 2:
            raise ValueError(f"Treatment column '{treat_col}' must have exactly 2 unique values. Found: {uniques}")
        # Simple heuristic: if one is 't'/'treatment'/'b' use it, else use 1, else use last sorted
        candidates = [v for v in uniques if str(v).lower() in ['t', 'treatment', 'test', 'b', '1', 'true']]
        if candidates:
            treat_val = candidates[0]
        else:
            treat_val = uniques[1] # fallback
            
    # 2. Split
    tdf = df[df[treat_col] == treat_val]
    cdf = df[df[treat_col] != treat_val]
    
    n_t = len(tdf)
    n_c = len(cdf)
    
    if n_t < 2 or n_c < 2:
         return {"error": "Insufficient sample size (<2)"}
         
    # 3. Detect outcome type if auto
    if outcome_type == 'auto':
        # check unique count or dtype
        if pd.api.types.is_numeric_dtype(df[outcome_col]):
             if df[outcome_col].nunique() <= 2:
                 outcome_type = 'binary'
             else:
                 outcome_type = 'continuous'
        else:
             # non-numeric -> likely binary (categorical)
             outcome_type = 'binary'
             
    # 4. Compute Stats
    effect = 0.0
    se = 0.0
    
    if outcome_type == 'binary':
        # Convert to 0/1 if needed
        # Assume higher/True is 1
        def to_binary(series):
            if pd.api.types.is_numeric_dtype(series): return series
            u = series.unique()
            # Map [0] to 0, [1] to 1
            # Sort: False/0 first, True/1 second
            pos_val = sorted(u)[-1] 
            return (series == pos_val).astype(int)
            
        t_vals = to_binary(tdf[outcome_col])
        c_vals = to_binary(cdf[outcome_col])
        
        p_t = t_vals.mean()
        p_c = c_vals.mean()
        
        effect = p_t - p_c
        # SE for diff proportions
        # se = sqrt( p(1-p)/n ... )
        var_t = p_t * (1 - p_t) / n_t
        var_c = p_c * (1 - p_c) / n_c
        se = np.sqrt(var_t + var_c)
        
    else:
        # Continuous
        mean_t = tdf[outcome_col].mean()
        mean_c = cdf[outcome_col].mean()
        var_t = tdf[outcome_col].var(ddof=1)
        var_c = cdf[outcome_col].var(ddof=1)
        
        effect = mean_t - mean_c
        se = np.sqrt(var_t/n_t + var_c/n_c)
        
    return {
        "n_t": n_t,
        "n_c": n_c,
        "effect_size": float(effect),
        "std_error": float(se),
        "treatment_val": str(treat_val),
        "outcome_type": outcome_type
    }
