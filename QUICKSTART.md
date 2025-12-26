# 🚀 Quick Start Guide

## Step 1: Backend Setup

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

*This will install:*
- FastAPI & Uvicorn (API server)
- PyPDF2 (PDF processing)
- sentence-transformers (embeddings)
- faiss-cpu (vector database)
- OpenAI (optional, for better answers)

## Step 2: Start Backend Server

```bash
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Backend is now running on **http://localhost:8000**

## Step 3: Frontend Setup

Open a **NEW** terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install Node.js dependencies (if not already done):

```bash
npm install
```

## Step 4: Start Frontend

```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms

➜  Local:   http://localhost:5173/
```

✅ Frontend is now running on **http://localhost:5173**

## Step 5: Use the Application

1. Open **http://localhost:5173** in your browser
2. **Upload a PDF** document (drag & drop or click to browse)
3. Wait for the animated progress (uploading → extracting → chunking → embedding → indexing)
4. **Ask questions** about your document
5. Get answers with source citations!

## 🎯 Testing Anti-Hallucination

Try asking questions:

### ✅ Questions IN the document:
- See relevant answers with source pages
- High confidence scores (>75%)

### ❌ Questions NOT in the document:
- Get: "No relevant information found in the uploaded document"
- Low confidence scores (<75%)

This proves the system doesn't hallucinate!

## 🔧 Optional: OpenAI Integration

For better answer quality, set your OpenAI API key:

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="your-key-here"
```

**Linux/Mac:**
```bash
export OPENAI_API_KEY="your-key-here"
```

Then restart the backend server.

Without OpenAI, the system still works but uses simple context concatenation instead of LLM-generated answers.

## 📊 API Documentation

Once backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🐛 Troubleshooting

### Backend won't start
- Check Python version (3.8+)
- Try: `pip install --upgrade pip`
- Install dependencies again

### Frontend won't start
- Check Node.js version (16+)
- Delete `node_modules` and run `npm install` again

### Can't upload PDF
- Check backend is running on port 8000
- Check browser console for CORS errors
- Make sure PDF file is valid

### Getting "No relevant data found" for valid questions
- Lower similarity threshold in `backend/main.py` (line 127)
- Try rephrasing the question
- Check if the document actually contains related information

## 🎨 Enjoy the Animations!

Watch for:
- 🎭 Fade-in transitions
- 📊 Animated progress bars
- 💬 Slide-up chat messages
- ✨ Glassmorphism effects
- 🌟 Button hover glows

---

**Made with ❤️ for production-ready RAG systems**
