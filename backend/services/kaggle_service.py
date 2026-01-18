
import os
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from backend.services.meta_prep import compute_summary_from_df
import json

# Define Dataset Metadata
DATASETS = {
    "cookie_cats": {
        "slug": "mursideyarkin/mobile-games-ab-testing-cookie-cats",
        "file": "cookie_cats.csv",
        "description": "Mobile Games A/B Testing (Gate 30 vs 40)"
    },
    "marketing": {
        "slug": "faviovaz/marketing-ab-testing",
        "file": "marketing_AB.csv",
        "description": "Marketing Campaigns Analysis"
    },
    "generic": {
        "slug": "zhangluyuan/ab-testing",
        "file": "ab_data.csv",
        "description": "Generic Web A/B Test"
    }
}

class KaggleService:
    def __init__(self):
        # Authenticate
        # Priority: KAGGLE_API_TOKEN (new) > KAGGLE_USERNAME/KEY (legacy) > ~/.kaggle/kaggle.json
        has_token = os.environ.get("KAGGLE_API_TOKEN")
        has_pair = os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY")
        
        if not (has_token or has_pair):
             # Check for ~/.kaggle/kaggle.json implicitly handled by library, 
             # but we warn if explicit env vars missing
             print("Warning: No Kaggle credentials found (KAGGLE_API_TOKEN or KAGGLE_USERNAME/KEY). API may fail.")
        
        self.download_dir = os.path.join(os.getcwd(), "data", "kaggle")
        os.makedirs(self.download_dir, exist_ok=True)

    def download_dataset(self, dataset_key: str) -> str:
        """Downloads dataset if not present. Returns path to CSV."""
        if dataset_key not in DATASETS:
            raise ValueError(f"Unknown dataset: {dataset_key}")
            
        info = DATASETS[dataset_key]
        target_dir = os.path.join(self.download_dir, dataset_key)
        target_file = os.path.join(target_dir, info["file"])
        
        if os.path.exists(target_file):
            return target_file
            
        # Download
        import kaggle
        try:
            print(f"Downloading {info['slug']}...")
            kaggle.api.dataset_download_files(info["slug"], path=target_dir, unzip=True)
            return target_file
        except Exception as e:
            if "403" in str(e):
                raise Exception("Kaggle API Auth Error. Please set KAGGLE_USERNAME and KAGGLE_KEY.")
            raise e

    def ingest_and_split(self, dataset_key: str, n_studies: int = 10, seed: int = 42) -> List[Dict[str, Any]]:
        """
        Orchestrator: Download -> Load -> Normalize -> Split -> Summarize
        """
        csv_path = self.download_dataset(dataset_key)
        df = pd.read_csv(csv_path)
        
        if dataset_key == "cookie_cats":
            return self._process_cookie_cats(df, n_studies, seed)
        elif dataset_key == "marketing":
            return self._process_marketing(df) # Natural split by campaign/date, n_studies ignored or used for filtering
        elif dataset_key == "generic":
            return self._process_generic(df, n_studies, seed)
        else:
            return []

    def _process_cookie_cats(self, df: pd.DataFrame, n_studies: int, seed: int):
        """
        Cookie Cats:
        gate_30 (Control) vs gate_40 (Treatment).
        Outcome: retention_1 (binary) or retention_7 (binary).
        Strategy: Random split into N cohorts.
        """
        np.random.seed(seed)
        
        # Treatment: gate_40 is new, gate_30 old
        # Rename for meta_prep compatibility
        # Treat: version='gate_40'
        
        # Shuffle
        df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
        
        # Split into N chunks
        chunks = np.array_split(df, n_studies)
        summaries = []
        
        for i, chunk in enumerate(chunks):
            # outcome = retention_1 (default)
            summary = compute_summary_from_df(
                chunk, 
                treat_col="version", 
                outcome_col="retention_1", 
                treat_val="gate_40", # Treatment
                outcome_type="binary"
            )
            if "error" not in summary:
                summary["study_id"] = f"cookie_cohort_{i+1}"
                summaries.append(summary)
                
        return summaries

    def _process_marketing(self, df: pd.DataFrame):
        """
        Marketing:
        Usually has columns: 'user id', 'test group', 'converted', 'total ads', 'most ads day', 'most ads hour'
        faviovaz/marketing-ab-testing schema:
        'user id', 'test group' (ad, psa), 'converted' (bool), 'total ads', etc.
        
        Split Strategy: 'test group' is the variant. 
        But we need MULTIPLE studies.
        Does this dataset have segments? 
        It has 'most ads day' (Monday..Sunday) and 'most ads hour'. 
        We can treat each DAY as a separate study to check consistency across days.
        """
        # Checks
        cols = [c.lower() for c in df.columns]
        # Treat: "ad", Control: "psa"
        # Outcome: "converted"
        
        # Map columns
        treat_col = "test group"
        outcome_col = "converted"
        
        # Unique days
        # Assuming column "most ads day" exists
        day_col = "most ads day"
        
        summaries = []
        days = df[day_col].unique()
        
        for day in days:
            sub = df[df[day_col] == day]
            summary = compute_summary_from_df(
                sub,
                treat_col=treat_col,
                outcome_col=outcome_col,
                treat_val="ad",
                outcome_type="binary"
            )
            if "error" not in summary:
                summary["study_id"] = f"marketing_{day}"
                summaries.append(summary)
                
        return summaries

    def _process_generic(self, df: pd.DataFrame, n_studies: int, seed: int):
        """
        Generic:
        group (control/treatment), landing_page, converted (0/1)
        Split: Random or by 'landing_page' if multiple? 
        Usually ab_data.csv has just 'new_page' vs 'old_page'.
        We will use Random User Split.
        """
        np.random.seed(seed)
        df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
        chunks = np.array_split(df, n_studies)
        
        summaries = []
        for i, chunk in enumerate(chunks):
             # Treat: treatment
             summary = compute_summary_from_df(
                 chunk,
                 treat_col="group",
                 outcome_col="converted",
                 treat_val="treatment",
                 outcome_type="binary"
             )
             if "error" not in summary:
                 summary["study_id"] = f"generic_cohort_{i+1}"
                 summaries.append(summary)
        return summaries
