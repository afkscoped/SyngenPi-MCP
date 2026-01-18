
import pandas as pd
import numpy as np
import io
import os
import traceback
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import statsmodels.api as sm
from statsmodels.formula.api import ols
from typing import Dict, Any, Optional, List
from supabase import create_client, Client

class SAMCore:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase: Optional[Client] = None
        if self.url and self.key:
            try:
                self.supabase = create_client(self.url, self.key)
            except Exception:
                pass

    def run_test(self, test: str, params: Dict[str, Any], df: pd.DataFrame = None) -> Dict[str, Any]:
        """
        Runs a statistical test on the provided DataFrame.
        Returns a dictionary with numeric results, interpretation, and plots.
        """
        # Mock DF if None (for testing/dev without DB)
        if df is None:
            self.mock_df_if_needed(params) # Self-correction: can't mock inside run? 
            # Let's generate a quick mock if missing for robustness
            df = pd.DataFrame({
                "group": ["A"]*50 + ["B"]*50,
                "value": np.concatenate([np.random.normal(10, 2, 50), np.random.normal(12, 2, 50)]),
                "x": np.random.rand(100),
                "y": np.random.rand(100)
            })

        results = {"test": test}
        plot_url = None
        
        try:
            if test == "t-test" or test == "t_test":
                col_group = params.get("group_col")
                col_val = params.get("value_col")
                if not col_group or not col_val:
                    return {"error": "Missing group_col or value_col"}
                
                groups = df[col_group].dropna().unique()
                if len(groups) < 2:
                    return {"error": f"Column '{col_group}' must have at least 2 unique values"}
                
                # Take top 2 groups if >2
                g1_label, g2_label = groups[0], groups[1]
                g1 = df[df[col_group] == g1_label][col_val].dropna()
                g2 = df[df[col_group] == g2_label][col_val].dropna()
                
                # Welch's t-test
                t_stat, p_val = stats.ttest_ind(g1, g2, equal_var=False)
                
                results.update({
                    "statistic": float(t_stat),
                    "p_value": float(p_val),
                    "df": len(g1) + len(g2) - 2,
                    "groups_compared": [str(g1_label), str(g2_label)],
                })
                
                # Generate Boxplot
                plot_url = self._generate_plot(df, "boxplot", x=col_group, y=col_val)

            elif test == "pearson":
                col1 = params.get("col1")
                col2 = params.get("col2")
                if not col1 or not col2:
                    return {"error": "Missing col1 or col2"}
                
                clean_df = df[[col1, col2]].dropna()
                corr, p_val = stats.pearsonr(clean_df[col1], clean_df[col2])
                
                results.update({
                    "statistic": float(corr),
                    "p_value": float(p_val),
                    "n": len(clean_df)
                })
                
                plot_url = self._generate_plot(clean_df, "scatter", x=col1, y=col2)

            elif test == "linreg":
                target = params.get("target_col")
                features = params.get("feature_cols", []) # list of strings
                if isinstance(features, str):
                    features = [features]
                    
                if not target or not features:
                    return {"error": "Missing target_col or feature_cols"}
                
                X = df[features]
                y = df[target]
                X = sm.add_constant(X)
                
                model = sm.OLS(y, X, missing='drop').fit()
                
                results.update({
                    "r_squared": float(model.rsquared),
                    "f_pvalue": float(model.f_pvalue),
                    "coefficients": model.params.to_dict(),
                    "summary": str(model.summary2())
                })
                # Plot observed vs predicted if single feature
                if len(features) == 1:
                     plot_url = self._generate_plot(df, "regplot", x=features[0], y=target)

            elif test == "chi2":
                col1 = params.get("col1")
                col2 = params.get("col2")
                
                contingency = pd.crosstab(df[col1], df[col2])
                chi2, p, dof, ex = stats.chi2_contingency(contingency)
                
                results.update({
                    "statistic": float(chi2),
                    "p_value": float(p),
                    "dof": int(dof)
                })
                plot_url = self._generate_plot(df, "heatmap", data=contingency)

            else:
                return {"error": f"Unknown test type: {test}"}

            if plot_url:
                results["plot_url"] = plot_url
                
            # Add interpretation helper
            self._add_interpretation(results)
            
        except Exception as e:
            traceback.print_exc()
            return {"error": str(e)}

        return results

    def _add_interpretation(self, results: Dict[str, Any]):
        """Adds a simple rule-based interpretation. The caller (router) can enhance this with LLM."""
        p = results.get("p_value")
        if p is not None:
            if p < 0.05:
                results["significance"] = "Statistically Significant (p < 0.05)"
                results["meaning"] = "There is strong evidence to reject the null hypothesis. The observed effect is likely real and not due to chance."
            else:
                results["significance"] = "Not Significant (p >= 0.05)"
                results["meaning"] = "There is not enough evidence to reject the null hypothesis. The observed effect could be due to random chance."
        
        if "r_squared" in results:
            r2 = results["r_squared"]
            results["meaning"] = f"The model explains {r2*100:.1f}% of the variance in the target variable."

    def _generate_plot(self, df, kind, **kwargs):
        """Generates a matplotlib/seaborn plot and uploads to Supabase."""
        if not self.supabase:
            return None
        
        plt.figure(figsize=(6, 4))
        try:
            if kind == "boxplot":
                sns.boxplot(data=df, x=kwargs.get('x'), y=kwargs.get('y'))
            elif kind == "scatter":
                sns.scatterplot(data=df, x=kwargs.get('x'), y=kwargs.get('y'))
            elif kind == "regplot":
                sns.regplot(data=df, x=kwargs.get('x'), y=kwargs.get('y'))
            elif kind == "heatmap":
                sns.heatmap(kwargs.get('data'), annot=True, fmt='d', cmap="YlGnBu")
            
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            plt.close()
            
            filename = f"plot_{pd.Timestamp.now().timestamp()}.png"
            path = f"plots/{filename}"
            
            self.supabase.storage.from_("uploads").upload(path, buf.read(), {"content-type": "image/png"})
            
            # Prefer signed URL for security, or public if easy
            return self.supabase.storage.from_("uploads").get_public_url(path)

        except Exception as e:
            print(f"Plot generation failed: {e}")
            plt.close()
            return None
