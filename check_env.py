import os
import sys

# Check for GROQ or OPENAI (either works)
REQUIRED_KEYS = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
]

OPTIONAL_LLM_KEYS = ["GROQ_API_KEY", "OPENAI_API_KEY"]  # Either one works

def check_env():
    print("----------------------------------------------------------------")
    print("Checking Environment Variables (backend/.env)...")
    print("----------------------------------------------------------------")
    
    missing = []
    env_path = os.path.join("backend", ".env")
    
    if os.path.exists(env_path):
        print(f"Found .env at: {env_path}")
        with open(env_path, "r") as f:
            for line in f:
                if line.strip() and not line.startswith("#") and "=" in line:
                    k, v = line.strip().split("=", 1)
                    os.environ[k] = v
    else:
        print(f"WARNING: .env file NOT found at {env_path}")
        
    for key in REQUIRED_KEYS:
        val = os.environ.get(key)
        if not val or val == "your_supabase_url_here" or val == "your_service_role_key_here":
            missing.append(key)
            print(f"[FAIL] {key} is missing or default.")
        else:
            print(f"[OK]   {key}")
    
    # Check for at least one LLM key (optional, just warn)
    has_llm = any(
        os.environ.get(k) and os.environ.get(k) != "YOUR_GROQ_API_KEY_HERE"
        for k in OPTIONAL_LLM_KEYS
    )
    
    for key in OPTIONAL_LLM_KEYS:
        val = os.environ.get(key)
        if val and val != "YOUR_GROQ_API_KEY_HERE":
            print(f"[OK]   {key}")
        else:
            print(f"[SKIP] {key} (not configured)")
    
    if not has_llm:
        print("[WARN] No LLM API key found. AI features will use fallback mode.")

    if missing:
        print("----------------------------------------------------------------")
        print("ERROR: Missing required environment variables!")
        print(f"Please update backend/.env with: {', '.join(missing)}")
        print("----------------------------------------------------------------")
        sys.exit(1)
    else:
        print("----------------------------------------------------------------")
        print("Environment Check PASSED.")
        print("----------------------------------------------------------------")
        sys.exit(0)

if __name__ == "__main__":
    check_env()
