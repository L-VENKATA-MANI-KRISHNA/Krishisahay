import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()
key = os.getenv("GOOGLE_API_KEY")
print(f"Testing with key: {key[:6]}...")

models = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-1.5-flash-latest"]

for m in models:
    print(f"\n--- Testing model: {m} ---")
    try:
        llm = ChatGoogleGenerativeAI(model=m, google_api_key=key)
        res = llm.invoke("Hi")
        print(f"Success! Response: {res.content}")
        break
    except Exception as e:
        print(f"Failure for {m}: {e}")
