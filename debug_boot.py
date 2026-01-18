import sys
import os
import traceback

# Add current dir to path to mimic running from root
sys.path.append(os.getcwd())

print("Attempting to import backend.main...")
try:
    from backend import main
    print("Import SUCCESS. App object:", main.app)
except Exception:
    print("Import FAILED.")
    traceback.print_exc()
