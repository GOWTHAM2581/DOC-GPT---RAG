"""
Startup Script for RAG Application
Run this to install dependencies and start the backend server
"""

import subprocess
import sys
import os

def run_command(command, cwd=None):
    """Run a shell command"""
    print(f"\n🔄 Running: {command}")
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"✅ Success!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e.stderr}")
        return False

def main():
    print("=" * 60)
    print("🚀 RAG Application Backend Setup")
    print("=" * 60)
    
    # Check Python version
    print(f"\n📌 Python version: {sys.version}")
    
    # Install dependencies
    print("\n📦 Installing Python dependencies...")
    if not run_command(f"{sys.executable} -m pip install -r requirements.txt"):
        print("❌ Failed to install dependencies")
        return
    
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("1. (Optional) Set OPENAI_API_KEY environment variable for better answers")
    print("2. Run: python main.py")
    print("3. Server will start on http://localhost:8000")
    print("\n🎯 Then start the frontend:")
    print("   cd ../frontend")
    print("   npm run dev")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
