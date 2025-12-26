# 🚀 Deployment Guide: DOC-GPT Production Setup

This guide outlines the steps to deploy **DOC-GPT** to a production environment using free tier resources while implementing **Gmail (Google) Login** and persistent document storage.

## 🛠 Tech Stack for Production
- **Frontend:** [Vercel](https://vercel.com/) (Free)
- **Backend:** [Render](https://render.com/) (Free Web Service)
- **Authentication:** [Clerk](https://clerk.com/) or [Firebase](https://firebase.google.com/) (Free tier - Clerk recommended for React)
- **Vector Database:** [Pinecone](https://www.pinecone.io/) (Free tier) or [Supabase](https://supabase.com/) (PgVector)
- **LLM API:** [Groq](https://groq.com/) or [OpenAI](https://openai.com/)

---

## 🔐 Phase 1: Authentication (Gmail Login)

To keep the project secure and allow only authenticated users, we will use **Clerk**.

1.  **Create a Clerk Account:** Go to [clerk.com](https://clerk.com/) and create a new project.
2.  **Enable Google Social Connection:**
    - In the Clerk Dashboard, go to **User & Auth -> Social Connections**.
    - Toggle on **Google**.
    - (Optional) For production, follow the instructions to add your own Google Client ID and Secret from the [Google Cloud Console](https://console.cloud.google.com/).
3.  **Integrate with Frontend:**
    - Install Clerk: `npm install @clerk/clerk-react`
    - Wrap your `main.jsx` with `<ClerkProvider>`.
    - Use `<SignedIn>` and `<SignedOut>` components in `App.jsx` to protect the route.
4.  **Secure the Backend:**
    - The frontend should send the Clerk JWT token in the `Authorization` header.
    - Update `backend/main.py` to verify the Clerk token using `clerk-sdk-python`.

---

## 🏗 Phase 2: Backend Deployment (Render)

Render's free tier is perfect for FastAPI, but remember that the disk is **ephemeral** (files disappear when the server restarts). For production-ready vector storage, use a remote DB.

### 1. Prepare for Render
- Create a `render.yaml` or just use the dashboard.
- Ensure `requirements.txt` is up to date.
- **Environment Variables:** Set these in the Render dashboard:
    - `GROQ_API_KEY`: Your Groq key.
    - `OPENAI_API_KEY`: Your OpenAI key.
    - `CLERK_SECRET_KEY`: From your Clerk dashboard.
    - `CORS_ORIGINS`: Your Vercel frontend URL.

### 2. Remote Vector Store (Optional but Recommended)
Since Render's disk resets, your FAISS index will be deleted periodically. To fix this:
- **Option A:** Use [Pinecone](https://www.pinecone.io/) (Serverless free tier). Replace FAISS in `vector_store.py` with Pinecone client.
- **Option B:** Use [Supabase PgVector](https://supabase.com/). See [Supabase Setup](#supabase-vector-setup) for detailed steps.

---

## 🌐 Phase 3: Frontend Deployment (Vercel)

1.  **Push to GitHub:** Ensure your code is in a GitHub repository.
2.  **Connect to Vercel:**
    - Go to [vercel.com](https://vercel.com/) and click "Add New -> Project".
    - Import your GitHub repository.
3.  **Configure Environment Variables:**
    - `VITE_API_URL`: The URL of your Render backend (e.g., `https://doc-gpt-api.onrender.com`).
    - `VITE_CLERK_PUBLISHABLE_KEY`: Found in your Clerk dashboard.
4.  **Build Settings:**
    - Framework Preset: `Vite`
    - Root Directory: `frontend`
    - Build Command: `npm run build`
    - Output Directory: `dist`

---

## 📝 Detailed Step-by-Step Instructions

### Step 1: Frontend Auth Integration
Add the following to your `frontend/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://your-backend-url.onrender.com
```

Modify `frontend/src/main.jsx`:
```javascript
import { ClerkProvider } from '@clerk/clerk-react'
// ...
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
)
```

### Step 2: Backend CORS & Security
Update `backend/main.py` to allow your Vercel URL in CORS:
```python
origins = [
    "http://localhost:5173",
    "https://your-app-name.vercel.app",
]
app.add_middleware(CORSMiddleware, allow_origins=origins, ...)
```

### Step 3: Supabase Vector Setup (Optional)
If you chose **Option B** in Phase 2, follow these steps:

1.  **Create a Project:** Sign up at [supabase.com](https://supabase.com/) and create a new project.
2.  **Enable PgVector:** In the Supabase Dashboard, go to **SQL Editor** and run:
    ```sql
    create extension if not exists vector;
    ```
3.  **Create Table:** Run the following SQL to create a table for your embeddings (Note: Dimension 384 for local, 1536 for OpenAI):
    ```sql
    create table if not exists documents (
      id bigserial primary key,
      content text,
      metadata jsonb,
      embedding vector(384) -- Change to 1536 if using OpenAI
    );
    ```
4.  **Create Search Function:**
    ```sql
    create or replace function match_documents (
      query_embedding vector(384), -- Change to 1536 if using OpenAI
      match_threshold float,
      match_count int
    )
    returns table (
      id bigint,
      content text,
      metadata jsonb,
      similarity float
    )
    language plpgsql
    as $$
    begin
      return query
      select
        documents.id,
        documents.content,
        documents.metadata,
        1 - (documents.embedding <=> query_embedding) as similarity
      from documents
      where 1 - (documents.embedding <=> query_embedding) > match_threshold
      order by similarity desc
      limit match_count;
    end;
    $$;
    ```
5.  **Environment Variables:** Add these to your Render/Local backend `.env`:
    ```env
    SUPABASE_URL=your-project-url
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    ```

### Step 4: Deployment Checklist
1. [ ] **GitHub Repo:** Frontend and Backend code pushed.
2. [ ] **Clerk Setup:** Google Login enabled.
3. [ ] **Render Deployment:** Backend live, env vars set.
4. [ ] **Vercel Deployment:** Frontend live, `VITE_API_URL` pointing to Render.
5. [ ] **Test:** Open Vercel URL, sign in with Gmail, upload PDF, and chat!

---

## 💰 Free Resource Summary
| Resource | Service | Monthly Cost |
| :--- | :--- | :--- |
| Hosting (Frontend) | Vercel | $0 |
| Hosting (Backend) | Render | $0 |
| Authentication | Clerk | $0 (up to 10k MAU) |
| Vector Database | Pinecone | $0 (1 starter index) |
| LLM API | Groq | $0 (Within rate limits) |

---
*Note: Render's free tier "sleeps" after 15 minutes of inactivity. The first request after a sleep may take ~30 seconds to wake up the server.*
