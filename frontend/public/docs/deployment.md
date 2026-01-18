
# Deployment & Roles

## Roles

- **Frontend**: The UI shell. Handles auth via Supabase and state.
- **Orchestrator**: The brain. Receives complex intents ("Make this dataset look more like finance data") and breaks them into steps.
- **MCP Studio Backend**: Unified Python service (FastAPI) running on port 8000.
    - Exposes `/synthetic`, `/sheets`, `/analytics`, `/orchestrator` routes.


## Deployment Notes

- **Vercel**: Deploy `frontend/`. Ensure `runtime="nodejs"` is set on API routes using Supabase to avoid edge-compat issues with certain libs.
- **Railway/Render**: Deploy Python services as Docker containers.
- **Supabase**: Use for Auth and Storage (buckets: `uploads`, `synthetic`).

## Troubleshooting

- **Supabase Build Error**: Ensure you use the factory pattern (`getSupabase()`) and do not access `process.env` at the top level of files.
- **E2B Timeout**: Sandbox execution has a default 30s timeout. Increase in `AgentCore` if needed.
- **Proxy Errors**: If `/api/backend` 404s, check `BACKEND_URL` in `.env.local` and ensure the backend is running on port 8000.

