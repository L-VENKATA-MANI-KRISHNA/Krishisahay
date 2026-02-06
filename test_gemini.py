from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os

load_dotenv()

models_to_try = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-pro"]

for model in models_to_try:
    print(f"Testing model: {model}")
    try:
        llm = ChatGoogleGenerativeAI(model=model, temperature=0.3)
        res = llm.invoke("Hello")
        print(f"SUCCESS with {model}: {res.content}")
        break
    except Exception as e:
        print(f"FAILED with {model}: {e}")
