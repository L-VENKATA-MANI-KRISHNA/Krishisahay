from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()

from rag import rag_engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for dev). Change to ["http://localhost:5173"] for prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    api_key: str = None
    language: str = "en"  # "en" or "hi"

@app.on_event("startup")
async def startup_event():
    # Attempt to load or build index on startup
    try:
        rag_engine.load_data()
        # In a real app, check if index exists, else build it
        if os.getenv("GOOGLE_API_KEY") or os.getenv("GROQ_API_KEY"):
            rag_engine.build_index()
        else:
            print("API Key not found. RAG will not function until key is provided.")
    except Exception as e:
        print(f"RAG Initialization Failed: {e}")


@app.get("/")
def read_root():
    return {"Hello": "KrishiSahay API"}

@app.post("/query")
def ask_query(request: QueryRequest):
    if request.api_key:
        os.environ["GOOGLE_API_KEY"] = request.api_key
    
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GROQ_API_KEY"):
         raise HTTPException(status_code=500, detail="LLM API Key not configured on server.")

    # Lazy build if not done
    if not rag_engine.vector_store:
         try:
            rag_engine.build_index()
         except Exception as e:
            print(f"Index build failed: {e}. Falling back to pure LLM.")
         
    # Pass language to RAG engine
    answer = rag_engine.get_answer(request.query, request.language)
    return {"answer": answer}

