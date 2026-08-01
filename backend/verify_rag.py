import os
import sys

# Ensure backend dir is in path
sys.path.append(os.getcwd())

# Force reload dotenv to pick up new key
from dotenv import load_dotenv
load_dotenv(override=True)

print(f"🔑 checking key... {os.getenv('GROQ_API_KEY')[:10]}...")

try:
    from langchain_groq import ChatGroq
    
    llm = ChatGroq(
        temperature=0, 
        model_name="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY")
    )
    
    print("🤖 Asking Groq: 'Is rice a crop?'...")
    response = llm.invoke("Is rice a crop? Answer Yes/No.")
    print(f"✅ Response: {response.content}")

except Exception as e:
    print(f"❌ Error: {e}")
