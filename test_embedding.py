from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key present: {bool(api_key)}")

models_to_try = [
    "models/embedding-001",
    "models/text-embedding-004",
    "models/gemini-embedding-001",
    "embedding-001"
]

for model in models_to_try:
    print(f"\nTesting Embedding Model: {model}")
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model=model)
        vec = embeddings.embed_query("Hello world")
        print(f"SUCCESS with {model}: Vector length {len(vec)}")
        break
    except Exception as e:
        print(f"FAILED with {model}: {e}")
