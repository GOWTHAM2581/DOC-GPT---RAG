# Deploying Backend to Railway (Free Trial / Hobby Tier)

Railway is an excellent alternative to Render. It is generally faster, has no "sleep" delays (on paid/trial), and builds very quickly.
**Note:** Railway moved to a trial model. If you need a *forever free* alternative, **Hugging Face Spaces** is the best option for AI/GPU apps.

## Option A: Railway (Fastest, Best UX, $5 Credit Trial)
Railway is much faster than Render but eventually requires a small payment (or trial credits).

1.  **Sign Up**: Go to [railway.app](https://railway.app/) and login with GitHub.
2.  **New Project**: Click "New Project" -> "Deploy from GitHub repo".
3.  **Select Repo**: Choose `GOWTHAM2581/DOC-GPT---RAG`.
4.  **Configure**:
    *   Railway usually auto-detects Python.
    *   Go to **Variables** tab.
    *   Add:
        *   `HUGGINGFACE_API_KEY`: `hf_...`
        *   `SUPABASE_URL`: `...`
        *   `SUPABASE_SERVICE_KEY`: `...`
        *   `GROQ_API_KEY`: `gsk_...`
        *   `CORS_ORIGINS`: `*` (or your Vercel URL)
5.  **Deploy**: Click "Deploy". It usually builds in <1 minute.
6.  **URL**: Go to "Settings" -> "Domains" -> "Generate Domain" to get your URL (e.g., `web-production.up.railway.app`).
7.  **Update Frontend**: Update your Vercel frontend environment variable `VITE_API_URL` with this new domain.

---

## Option B: Hugging Face Spaces (Forever Free, Good for AI)
Since this is an RAG app, hosting it directly on Hugging Face Spaces is a great "forever free" option.

1.  **Create Space**:
    *   Go to [huggingface.co/spaces](https://huggingface.co/spaces).
    *   Click "Create new Space".
    *   **Name**: `doc-gpt-backend`.
    *   **SDK**: Select **Docker**. (This gives us full control).
    *   **Visibility**: Public.
2.  **Setup Code**:
    *   Hugging Face Spaces expects a Dockerfile in the root.
    *   We need to create a `Dockerfile` in the root of your repo (currently it's in `backend/` or missing).
    
    *Create a file named `Dockerfile` in the root:*
    ```dockerfile
    FROM python:3.11-slim

    WORKDIR /app

    # Install dependencies
    COPY backend/requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt

    # Copy code
    COPY backend/ .

    # Create data dir
    RUN mkdir -p data

    # Expose port (HF Spaces uses 7860)
    EXPOSE 7860

    # Run app
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
    ```
    *(I can help you create this file if you choose this option).*

3.  **Environment Variables**:
    *   In your Space settings, go to **"Settings"** -> **"Variables and secrets"**.
    *   Add all your keys (`HUGGINGFACE_API_KEY`, `SUPABASE...`, etc.) as **Secrets**.

4.  **Use the URL**:
    *   Your backend URL will be: `Upload failed: HuggingFace API failed: Not Found` (Look for the "Direct URL" in the options or embed link).
