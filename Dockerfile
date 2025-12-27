# Use an official lightweight Python image
FROM python:3.11-slim

# Set working directory to /app
WORKDIR /app

# Install system dependencies (needed for some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first to leverage Docker cache
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend/ .

# Create a writable directory for Supabase/FAISS temporary data if needed
RUN mkdir -p data && chmod 777 data

# Expose port (Hugging Face Spaces defaults to 7860)
EXPOSE 7860

# Run the application
# Note: HF Spaces sets PORT env var to 7860, this command respects it or defaults to 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
