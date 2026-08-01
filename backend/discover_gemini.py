import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

try:
    genai.configure(api_key=api_key)
    print("Available models:")
    models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            models.append(m.name)
    
    if models:
        # Try the first one that looks like flash
        test_model = next((m for m in models if "flash" in m), models[0])
        print(f"\nTesting with: {test_model}")
        model = genai.GenerativeModel(test_model)
        res = model.generate_content("hi")
        print(f"Success! Response: {res.text}")
    else:
        print("No models found.")
except Exception as e:
    print(f"Error: {e}")
