# Setup Guide: Supabase & E2B

This guide explains how to get the necessary API keys and configure the services for MCP Studio.

## 1. Supabase (Database & Storage)

Supabase provides the database (PostgreSQL) and file storage for your datasets/generated files.

1.  **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Get API Keys**:
    *   Go to **Project Settings** (gear icon) -> **API**.
    *   Copy the **Project URL**.
    *   Copy the **`anon` / `public` Key**. (This allows the Frontend to talk to Supabase).
    *   Copy the **`service_role` Key**. (This allows the Backend to bypass RLS and perform admin tasks).
3.  **Setup Storage**:
    *   Go to **Storage** (folder icon) in the left sidebar.
    *   Create a new Bucket named **`uploads`**.
    *   Create a new Bucket named **`synthetic`**.
    *   **Policies**: For local development, you can make these Public or add a policy allowing "All operations" (SELECT, INSERT, UPDATE, DELETE) for `anon` users.
        *   *Warning*: In production, you should restrict this to authenticated users only.

**Configuration**:
*   **Frontend**: Add URL and Anon Key to `frontend/.env.local`.
*   **Backend**: Add URL and Service Role Key to `backend/.env`.

---

## 2. E2B (Sandboxed Code Execution)

E2B provides the secure sandbox where the "Agent" runs Python code to edit spreadsheets safe from your local machine.

1.  **Get API Key**:
    *   Go to [e2b.dev](https://e2b.dev).
    *   Sign up / Log in.
    *   Go to **Keys** or Dashboard.
    *   Create a new **API Key**.
    *   Copy the key (starts with `e2b_...`).

**Configuration**:
*   **Backend**: Add `E2B_API_KEY=e2b_...` to `backend/.env`.

---

## 3. OpenAI (LLM Intelligence)

Required for the Orchestrator, Agent, and detailed Stats explanations.

1.  **Get API Key**:
    *   Go to [platform.openai.com](https://platform.openai.com).
    *   Create a new secret key.

**Configuration**:
*   **Backend**: Add `OPENAI_API_KEY=sk-...` to `backend/.env`.
