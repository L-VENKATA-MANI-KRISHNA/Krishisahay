import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

print("Listing models...")
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(f"Embedding Model: {m.name}")
    elif 'generateContent' in m.supported_generation_methods:
        print(f"Generative Model: {m.name}")
