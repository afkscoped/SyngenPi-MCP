
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from backend.services.syngen_core import SyngenCore
from backend.services.meta_prep import compute_summary_from_df

class SyngenLoop:
    def __init__(self):
        self.syngen = SyngenCore()
        
    def generate_batch(self, 
                       n_studies: int = 10, 
                       domain: str = "saas", 
                       rows_per_study: int = 500,
                       effect_size_target: float = 0.05, # Mean effect to inject
                       heterogeneity: float = 0.01 # Variance of effect across studies
                       ) -> List[Dict[str, Any]]:
        
        summaries = []
        
        for i in range(n_studies):
            # 1. Determine local effect for this study
            # Draw from Normal(target, heterogeneity)
            local_effect = np.random.normal(effect_size_target, heterogeneity)
            
            # 2. Generate Data via Syngen
            # We need Syngen to support injecting effect? 
            # Current SyngenCore generates "realistic" data but might not allow precise control of effect size easily 
            # unless we modify it or post-process it.
            # Approach: Generate data, then *modify* the outcome column for the treatment group to induce the effect.
            
            # Gen generic dataset
            res = self.syngen.generate(
                dataset_id=f"syn_meta_{i}",
                rows=rows_per_study,
                domain=domain,
                seed=i # Different seed per study
            )
            
            # We can't access the DF directly from 'res' (it returns a URL).
            # We need to access the logic that creates the DF. 
            # This is a limitation of the current SyngenCore separation.
            # WORKAROUND: For Meta-Analysis simulation, we will generate a local DF using SDV logic 
            # if possible, or just mock the *structure* here if SyngenCore is too coupled to Supabase upload.
            
            # Actually, SyngenCore has `generate_mock_data`. Let's use that logic or similar.
            # For strict correctness, let's implement a lightweight generator here to ensure speed and control.
            
            df = self._generate_controlled_df(rows_per_study, local_effect, domain)
            
            # 3. Compute Summary
            summary = compute_summary_from_df(
                df, 
                treat_col="group", 
                outcome_col="conversion", 
                treat_val="treatment", 
                outcome_type="binary"
            )
            summary["study_id"] = f"synthetic_{i+1}"
            summary["true_effect"] = local_effect
            summaries.append(summary)
            
        return summaries

    def _generate_controlled_df(self, n, effect, domain):
        # Simple generator
        # Group: 50/50
        group = np.random.choice(["control", "treatment"], size=n)
        
        # Baseline conversion
        baseline = 0.10 if domain == "ecommerce" else 0.20
        
        # Outcome
        # Prob of success depends on group
        probs = np.where(group == "treatment", baseline + effect, baseline)
        probs = np.clip(probs, 0.0, 1.0)
        
        conversion = np.random.rand(n) < probs
        
        return pd.DataFrame({
            "group": group,
            "conversion": conversion.astype(int)
        })
