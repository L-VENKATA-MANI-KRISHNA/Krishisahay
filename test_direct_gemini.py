import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key found: {bool(api_key)}")

if api_key:
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello")
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"Direct SDK Error: {e}")

    # Check network connectivity
    import requests
    try:
        print("Testing https://generativelanguage.googleapis.com...")
        requests.get("https://generativelanguage.googleapis.com", timeout=5)
        print("Connectivity Check: Success")
    except Exception as e:
        print(f"Connectivity Check Failed: {e}")
