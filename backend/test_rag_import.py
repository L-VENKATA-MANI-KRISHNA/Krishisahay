import sys
import os

# Ensure backend dir is in path
sys.path.append(os.getcwd())

print("Attempting to import rag...")
try:
    import rag
    print("✅ RAG module imported successfully!")
except NameError as ne:
    print(f"❌ NameError: {ne}")
except ImportError as ie:
    print(f"❌ ImportError: {ie}")
except Exception as e:
    print(f"❌ Other Error: {e}")
