from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()

try:
    from rag import rag_engine
except Exception as e:
    print(f"⚠️ RAG Module Import Failed: {e}")
    # Dummy RAG to allow server to start
    class DummyRAG:
        def load_data(self): pass
        def build_index(self): pass
        full_docs = []
        vector_store = None
        def get_answer(self, q, l="en"): return "RAG System is currently unavailable."
    rag_engine = DummyRAG()

from auth import UserSignup, UserLogin, register_user, authenticate_user, get_current_user, get_database
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

app = FastAPI()

class ChatMessage(BaseModel):
    text: str
    sender: str  # 'user' or 'bot'
    image: Optional[str] = None
    timestamp: Optional[datetime] = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for dev). Change to ["http://localhost:5173"] for prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Endpoints
@app.post("/signup")
def signup(user: UserSignup):
    print(f"Received signup request for: {user.phone}")
    try:
        result = register_user(user)
        print(f"Register result: {result}")
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        print(f"Signup Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(user: UserLogin):
    result = authenticate_user(user)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    return result

@app.get("/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# --- Chat Session & History Endpoints ---

class ChatSession(BaseModel):
    id: str  # UUID
    title: str
    updated_at: datetime

@app.get("/chat/sessions", response_model=List[ChatSession])
def get_chat_sessions(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        collection = get_database()
        sessions = collection.database.get_collection("sessions").find(
            {"user_id": user_id}
        ).sort("updated_at", -1)
        
        return [ChatSession(
            id=s["id"],
            title=s.get("title", "New Chat"),
            updated_at=s.get("updated_at", datetime.utcnow())
        ) for s in sessions]
    except Exception as e:
        print(f"Session Fetch Error: {e}")
        return []

@app.post("/chat/session")
def create_chat_session(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        import uuid
        session_id = str(uuid.uuid4())
        
        collection = get_database()
        session_doc = {
            "id": session_id,
            "user_id": user_id,
            "title": "New Chat",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        collection.database.get_collection("sessions").insert_one(session_doc)
        return {"id": session_id, "title": "New Chat"}
    except Exception as e:
        print(f"Session Create Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@app.delete("/chat/session/{session_id}")
def delete_chat_session(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        collection = get_database()
        # Delete session
        collection.database.get_collection("sessions").delete_one(
            {"id": session_id, "user_id": user_id}
        )
        # Delete messages
        collection.database.get_collection("chats").delete_many(
            {"session_id": session_id, "user_id": user_id}
        )
        return {"status": "deleted"}
    except Exception as e:
        print(f"Session Delete Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")

@app.delete("/chat/sessions")
def delete_all_sessions(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        collection = get_database()
        # Delete all sessions for user
        collection.database.get_collection("sessions").delete_many({"user_id": user_id})
        # Delete all chats for user
        collection.database.get_collection("chats").delete_many({"user_id": user_id})
        return {"status": "all_deleted"}
    except Exception as e:
        print(f"Delete All Sessions Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete all sessions")

@app.get("/chat/history/{session_id}", response_model=List[ChatMessage])
def get_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        collection = get_database()
        chats_cursor = collection.database.get_collection("chats").find(
            {"session_id": session_id, "user_id": user_id}
        ).sort("timestamp", 1)
        
        history = []
        for chat in chats_cursor:
            history.append(ChatMessage(
                text=chat["text"],
                sender=chat["sender"],
                image=chat.get("image"),
                timestamp=chat.get("timestamp")
            ))
        return history
    except Exception as e:
        print(f"History Fetch Error: {e}")
        return []

@app.post("/chat/message/{session_id}")
def save_chat_message(session_id: str, message: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        collection = get_database()
        
        # Save Message
        chat_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "text": message.text,
            "sender": message.sender,
            "image": message.image,
            "timestamp": message.timestamp or datetime.utcnow()
        }
        collection.database.get_collection("chats").insert_one(chat_doc)
        
        # Update Session Timestamp & Title (if new)
        update_fields = {"updated_at": datetime.utcnow()}
        
        # Set title based on first user message if title is "New Chat"
        if message.sender == 'user':
            session = collection.database.get_collection("sessions").find_one({"id": session_id})
            if session and session.get("title") == "New Chat":
                # Generate simple title from first few words
                new_title = (message.text[:30] + '...') if len(message.text) > 30 else message.text
                update_fields["title"] = new_title

        collection.database.get_collection("sessions").update_one(
            {"id": session_id},
            {"$set": update_fields}
        )
            
        return {"status": "saved"}
    except Exception as e:
        print(f"Message Save Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save message")

class QueryRequest(BaseModel):
    query: str
    image: Optional[str] = None
    api_key: Optional[str] = None
    language: str = "en"
    query: str
    image: Optional[str] = None
    api_key: Optional[str] = None
    language: str = "en"

@app.on_event("startup")
def startup_event():
    # Attempt to load or build index on startup
    try:
        rag_engine.load_data()
        # In a real app, check if index exists, else build it
        if os.getenv("GOOGLE_API_KEY") or os.getenv("GROQ_API_KEY"):
            # Only build if we have docs, otherwise just warn
            if rag_engine.full_docs:
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
        print(f"🔑 Received API Key from frontend (ends with ...{request.api_key[-5:]})")
        os.environ["GOOGLE_API_KEY"] = request.api_key
    
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GROQ_API_KEY"):
         raise HTTPException(status_code=500, detail="LLM API Key not configured on server.")

    # Lazy build if not done
    if not rag_engine.vector_store:
         try:
            rag_engine.build_index()
         except Exception as e:
            print(f"Index build failed: {e}. Falling back to pure LLM.")
         
    # Pass language and image to RAG engine
    try:
        answer = rag_engine.get_answer(request.query, request.language, request.image)
        if not answer:
             print("⚠️ RAG Engine returned empty answer.")
             return {"answer": "I apologize, but I couldn't generate a response. Please try again."}
        return {"answer": answer}
    except Exception as e:
        print(f"❌ Query Processing Error: {e}")
        return {"answer": "I encountered an error while processing your query. Please check your connection or try a different question."}

