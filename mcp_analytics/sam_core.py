
import pandas as pd
import numpy as np
from scipy import stats
# import statsmodels.api as sm # Uncomment if needed

class SAMCore:
    def run_test(self, test: str, params: dict, df: pd.DataFrame = None):
        # Mock DF if None
        if df is None:
            df = pd.DataFrame({
                "group": ["A"]*50 + ["B"]*50,
                "value": np.concatenate([np.random.normal(10, 2, 50), np.random.normal(12, 2, 50)])
            })

        results = {}
        
        if test == "t-test":
            col_group = params.get("group_col", "group")
            col_val = params.get("value_col", "value")
            
            groups = df[col_group].unique()
            if len(groups) < 2:
                return {"error": "Not enough groups"}
            
            g1 = df[df[col_group] == groups[0]][col_val]
            g2 = df[df[col_group] == groups[1]][col_val]
            
            t_stat, p_val = stats.ttest_ind(g1, g2)
            results = {
                "test": "Independent T-Test",
                "t_statistic": float(t_stat),
                "p_value": float(p_val),
                "significant": p_val < 0.05,
                "interpretation": "Significant difference found." if p_val < 0.05 else "No significant difference."
            }
            
        elif test == "pearson":
            col1 = params.get("col1")
            col2 = params.get("col2")
            corr, p_val = stats.pearsonr(df[col1], df[col2])
            results = {
                "test": "Pearson Correlation",
                "correlation": float(corr),
                "p_value": float(p_val)
            }
            
        # Add more tests (ANOVA, Chi2) as needed per spec
        
        return results
