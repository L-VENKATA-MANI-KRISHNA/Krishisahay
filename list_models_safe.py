import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

with open("valid_models_clean.txt", "w", encoding="utf-8") as f:
    f.write("--- Generative Models ---\n")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            f.write(f"{m.name}\n")
    f.write("\n--- Embedding Models ---\n")
    for m in genai.list_models():
        if 'embedContent' in m.supported_generation_methods:
            f.write(f"{m.name}\n")
