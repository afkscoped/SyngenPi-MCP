
try:
    import autogluon.tabular
    from autogluon.tabular import TabularPredictor
    print("SUCCESS: AutoGluon is installed and working.")
except ImportError as e:
    print(f"FAILURE: Could not import AutoGluon. Error: {e}")
except Exception as e:
    print(f"FAILURE: Error during import: {e}")
