import uvicorn
import sys
import os

# Redirect stdout and stderr to a file
sys.stdout = open("server_debug.log", "w", encoding="utf-8")
sys.stderr = sys.stdout

print("Starting Debug Server...")
try:
    from main import app
    print("Import successful. Starting Uvicorn...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
