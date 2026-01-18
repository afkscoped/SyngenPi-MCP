
import numpy as np
import pandas as pd
from scipy import stats
import matplotlib.pyplot as plt
import statsmodels.api as sm
import os
import io
from typing import List, Dict, Tuple, Any
from supabase import create_client, Client

class MetaCore:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase = create_client(self.url, self.key) if self.url and self.key else None

    def fixed_effects(self, effects, ses):
        weights = 1.0 / (ses**2)
        pooled = np.sum(weights * effects) / np.sum(weights)
        pooled_se = np.sqrt(1.0 / np.sum(weights))
        return pooled, pooled_se, weights

    def cochrans_Q(self, effects, ses):
        pooled, _, weights = self.fixed_effects(effects, ses)
        Q = np.sum(weights * (effects - pooled)**2)
        df = len(effects) - 1
        return Q, df

    def I2(self, Q, df):
        if Q <= df:
            return 0.0
        return max(0.0, (Q - df) / Q * 100.0)

    def dersimonian_laird(self, effects, ses):
        # returns pooled_effect, pooled_se, tau2
        k = len(effects)
        w = 1.0 / (ses**2)
        sumw = np.sum(w)
        sumw2 = np.sum(w**2)
        
        fixed_pooled = np.sum(w * effects) / sumw
        Q = np.sum(w * (effects - fixed_pooled)**2)
        df = k - 1
        
        # tau^2
        denom = sumw - (sumw2/sumw)
        if denom <= 0: denom = 0.0001 # prevent div/0
        tau2 = max(0.0, (Q - df) / denom)
        
        w_star = 1.0 / (ses**2 + tau2)
        pooled = np.sum(w_star * effects) / np.sum(w_star)
        pooled_se = np.sqrt(1.0 / np.sum(w_star))
        
        return pooled, pooled_se, tau2, w_star

    def egger_test(self, effects, ses):
        if len(effects) < 3:
             return 0.0, 1.0, None # Not enough data
             
        precision = 1.0 / ses
        # Standardized effect = effect / se, regressed on precision
        # Egger's regression: effect/se = a + b * (1/se)
        # However, common implementation: Regress Standardized Effect Size (z-score) against Precision
        # OR simpler: Regress Effect on SE (weighted)?
        # The standard approach: y = effect/se, x = 1/se. Intercept is bias.
        
        y = effects / ses
        x = 1.0 / ses
        X = sm.add_constant(x)
        
        try:
            model = sm.OLS(y, X).fit()
            intercept_p = model.pvalues[0] # Test if intercept != 0
            intercept = model.params[0]
            return intercept, intercept_p, model
        except Exception:
            return 0.0, 1.0, None

    def funnel_plot(self, effects, ses, study_ids):
        # Generate plot in memory
        precision = 1.0 / ses
        plt.figure(figsize=(8,6))
        plt.scatter(effects, precision, alpha=0.6, c='blue', edgecolors='k')
        
        # Add labels if few studies
        if len(study_ids) <= 20:
             for i, s in enumerate(study_ids):
                plt.annotate(s, (effects[i], precision[i]), fontsize=8, alpha=0.7)
                
        # Draw pooled line (Fixed for reference usually, or Random based on choice)
        pooled, _, _ = self.fixed_effects(effects, ses)
        plt.axvline(pooled, color='r', linestyle='--', label=f'Pooled (FE): {pooled:.3f}')
        
        # Pseudo-confidence intervals (funnel shape)
        # 1.96 * SE around pooled
        # SE = 1/Precision -> Precision = 1/SE
        # x = pooled +/- 1.96 * SE
        max_se = np.max(ses) if len(ses) > 0 else 0.1
        min_se = np.min(ses) if len(ses) > 0 else 0.01
        
        y_range = np.linspace(min(precision)*0.9, max(precision)*1.1, 100)
        # se = 1/y
        x_left = pooled - 1.96 * (1/y_range)
        x_right = pooled + 1.96 * (1/y_range)
        plt.plot(x_left, y_range, 'k:', alpha=0.3)
        plt.plot(x_right, y_range, 'k:', alpha=0.3)
        
        plt.xlabel("Effect Size")
        plt.ylabel("Precision (1/SE)")
        plt.title("Funnel Plot")
        plt.legend()
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()
        return buf

    def run_analysis(self, summaries: List[Dict[str, Any]], method='random'):
        effects = np.array([float(s['effect_size']) for s in summaries])
        ses = np.array([float(s['std_error']) for s in summaries])
        # Add tiny epsilon to SE if 0 to prevent div/0
        ses[ses == 0] = 1e-6
        
        study_ids = [s.get('study_id', f"s_{i}") for i, s in enumerate(summaries)]
        
        if method == 'fixed':
            pooled, pooled_se, weights = self.fixed_effects(effects, ses)
            tau2 = 0.0
        else:
            pooled, pooled_se, tau2, weights = self.dersimonian_laird(effects, ses)
            
        Q, df = self.cochrans_Q(effects, ses)
        i2 = self.I2(Q, df)
        intercept, intercept_p, _ = self.egger_test(effects, ses)
        
        # Upload Plot
        plot_url = ""
        if self.supabase:
            try:
                plot_buf = self.funnel_plot(effects, ses, study_ids)
                path = f"meta/funnel_{pd.Timestamp.now().timestamp()}.png"
                self.supabase.storage.from_("uploads").upload(path, plot_buf.read(), {"content-type": "image/png"})
                
                # Get URL
                signed = self.supabase.storage.from_("uploads").create_signed_url(path, 3600)
                if signed and 'signedURL' in signed:
                    plot_url = signed['signedURL']
            except Exception as e:
                print(f"Plot upload failed: {e}")
                
        return {
            "pooled_effect": float(pooled),
            "ci": [float(pooled - 1.96*pooled_se), float(pooled + 1.96*pooled_se)],
            "std_error": float(pooled_se),
            "tau2": float(tau2),
            "q": float(Q),
            "df": int(df),
            "i2": float(i2),
            "egger_p": float(intercept_p),
            "publication_bias": intercept_p < 0.1 if intercept_p is not None else False,
            "plot_url": plot_url
        }
