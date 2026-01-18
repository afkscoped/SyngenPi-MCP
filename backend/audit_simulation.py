
import unittest
import numpy as np
from backend.services.meta_core import MetaCore

class TestMetaAudit(unittest.TestCase):
    def setUp(self):
        self.meta = MetaCore()
        
    def test_end_to_end_null_scenario(self):
        """
        Scenario: 20 experiments.
        - 18 are NULL (effect ~ 0, noise)
        - 2 are FALSE POSITIVES (effect > 0, due to noise/p-hacking)
        
        Expectation: 
        - Pooled effect should be close to 0.
        - If Random Effects is used, it might be slightly higher than Fixed but CI should hopefully cross 0 or provide high I^2.
        - Funnel plot logic should be executable.
        """
        np.random.seed(42)
        summaries = []
        
        # 18 Null studies: True effect = 0, SE ~ 0.05
        # Observed effect ~ N(0, 0.05)
        for i in range(18):
            se = 0.05
            effect = np.random.normal(0, se)
            summaries.append({
                "study_id": f"null_{i}",
                "effect_size": effect,
                "std_error": se,
                "n_t": 1000,
                "n_c": 1000
            })
            
        # 2 "False Positive" studies: True effect = 0, but they 'got lucky' or p-hacked
        # Let's force them to be significant: effect > 1.96 * SE
        for i in range(2):
            se = 0.05
            effect = 0.12 # > 1.96*0.05 = 0.098
            summaries.append({
                "study_id": f"fp_{i}",
                "effect_size": effect,
                "std_error": se,
                "n_t": 1000,
                "n_c": 1000
            })
            
        print("\n--- Simulation Data (First 5) ---")
        for s in summaries[:5]:
            print(s)
            
        # Run Random Effects Meta-Analysis
        result = self.meta.run_analysis(summaries, method='random')
        
        print("\n--- Meta-Analysis Result ---")
        print(f"Pooled Effect: {result['pooled_effect']:.4f}")
        print(f"95% CI: {result['ci']}")
        print(f"I2: {result['i2']:.2f}%")
        print(f"Egger P: {result['egger_p']:.4f}")
        
        # Audit Checks
        # 1. Pooled effect should be much smaller than the outliers (0.12)
        # 18 studies ~ 0, 2 studies ~ 0.12. Weighted avg should be around (18*0 + 2*0.12)/20 = 0.012
        self.assertLess(result['pooled_effect'], 0.04, "Pooled effect inflated by outliers")
        
        # 2. CI should likely capture 0 or be very close to it
        lower, upper = result['ci']
        # Note: With 2 strong outliers, heterogeneity will be present.
        print(f"CI spans 0?: {lower <= 0 <= upper}")
        
        # 3. I2 should detect some heterogeneity
        # With 18 at 0 and 2 at 0.12, Q should be significant
        self.assertGreater(result['i2'], 0.0, "Heterogeneity not detected")
        
    def test_formulas(self):
        # Verification against a known textbook example (Cochrane Handbook or similar simple case)
        # Study 1: Effect=0.5, SE=0.1
        # Study 2: Effect=0.6, SE=0.1
        # FE Pooled: (0.5+0.6)/2 = 0.55 (equal weights)
        # SE pooled: sqrt(1 / (100+100)) = sqrt(1/200) = 0.0707
        
        s = [
            {"effect_size": 0.5, "std_error": 0.1},
            {"effect_size": 0.6, "std_error": 0.1}
        ]
        res = self.meta.run_analysis(s, method='fixed')
        self.assertAlmostEqual(res['pooled_effect'], 0.55, places=3)
        self.assertAlmostEqual(res['std_error'], 0.0707, places=3)

if __name__ == '__main__':
    unittest.main()
