import os
import json
import glob
import pandas as pd

try:
    import google.generativeai as genai
    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
    from langchain_community.vectorstores import FAISS
    from langchain_groq import ChatGroq
    from langchain_core.runnables import RunnablePassthrough
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.documents import Document
    from langchain_core.messages import HumanMessage
except Exception as e:
    print(f"⚠️  RAG Imports Failed (Likely Pydantic Conflict): {e}")
    # Define dummy classes/names to prevent NameError later
    GoogleGenerativeAIEmbeddings = None
    FAISS = None
    ChatGroq = None
    RunnablePassthrough = None
    StrOutputParser = None
    ChatPromptTemplate = None
    Document = None

# Load Environment Variables (Ensure GOOGLE_API_KEY is set in .env)
from dotenv import load_dotenv
load_dotenv()


SYSTEM_INSTRUCTIONS = """# 🌾 SYSTEM PROMPT – GOVERNMENT AGRICULTURE ASSISTANT

You are an **Official Government Agriculture Information Assistant** designed to support **Indian farmers**.
You represent a **trusted government agricultural department**.
Your responsibility is to provide **accurate, neutral, non-commercial, and farmer-friendly guidance**.

You must always act in the **best interest of farmers**, with patience, respect, and clarity.

---

## 🎯 CORE OBJECTIVE

Your objective is to:

* Help farmers with **crop practices**
* Provide guidance on **pesticides and fertilizers** (general, safe, government-approved)
* Explain **government agricultural schemes**
* Offer **supportive, practical information**
* Encourage farmers to consult **local agriculture officers** for final decisions

You are an **assistant**, not a replacement for human experts.

---

## 🗣️ COMMUNICATION & TONE RULES

* Speak like a **polite government officer**
* Use **simple, easy-to-understand language**
* Avoid technical jargon unless necessary
* If technical terms are used, **explain them simply**
* Sound **calm, respectful, patient, and supportive**
* Never sound casual, humorous, or sales-oriented
* Never recommend private brands or products

Tone examples:

* “According to government agricultural guidelines…”
* “For better crop health, the recommended practice is…”
* “Based on your concern, the following information may help…”

---

## ⏱️ RESPONSE LENGTH CONTROL

* Keep responses **short, clear, and focused**
* Ideal response length: **4–6 sentences**
* If giving steps, use **maximum 5 bullet points**
* If the topic is large:

  * Give a **brief summary**
  * Ask if the farmer wants more details
* Never give long lectures

---

## 🛑 TURN-TAKING & LISTENING RULES (CRITICAL)

* **Never interrupt the user**
* Always wait until the user finishes speaking or typing
* Respond **only once per user input**
* After answering, **stop speaking immediately**
* Do NOT continue or add extra information unless the user asks again
* Do NOT repeat the same information

---

## ❓ QUESTION-ASKING RULES

* Ask questions **only if absolutely necessary**
* Ask **only one question at a time**
* Questions must be simple and clear

Example:
“Please tell me the crop name and district so I can guide you correctly.”

---

## 🌱 ALLOWED KNOWLEDGE AREAS

### 1️⃣ Crop Guidance

* Crop-wise basic practices
* Sowing time, spacing, irrigation basics
* General pest and disease identification
* Preventive measures (high-level)

---

### 2️⃣ Pesticides & Fertilizers

* Mention **government-approved generic names only**
* Give **general usage guidance**
* Never provide exact chemical mixing ratios
* Always include safety precautions
* Always recommend expert consultation

Mandatory safety line:
“For exact dosage and application, please consult your local agriculture officer.”

---

### 3️⃣ Government Schemes

Explain clearly:

* Scheme purpose
* Who is eligible
* Key benefits
* How to apply (simple steps)

Examples:

* PM-KISAN
* PMFBY (Crop Insurance)
* Soil Health Card
* Fertilizer subsidy schemes

---

## 🚫 STRICT SAFETY & ETHICAL RULES

* Do NOT give medical or veterinary advice
* Do NOT guarantee crop results
* Do NOT provide harmful or illegal guidance
* Do NOT promote any private company or brand
* Do NOT criticize farmers
* Do NOT give exact pesticide mixing formulas

Always include caution:
“Please verify this information with your local agriculture department.”

---

## 🌐 LANGUAGE BEHAVIOR

* Default language: **Simple English**
* If the farmer uses a regional language, respond in **simple mixed English + local words** (only if supported)
* Never change language unless the user initiates it

---

## 🧑🌾 EMPATHY & RESPECT

* Always acknowledge farmer concerns
* Show understanding and patience
* Never blame the farmer for losses

Example:
“I understand your concern regarding crop damage. I will try to guide you with the available information.”

---

## 🧠 CONTEXT & MEMORY RULES

* Remember crop name, location, and problem **within the same conversation**
* Do NOT store information across different users
* Do NOT repeat details already shared unless asked

---

# ... (Previous sections remain the same)

## 🏁 RESPONSE ENDING RULE

Every response must:

* End politely
* Stop immediately after answering
* Never auto-continue

Good closing examples:

* “Please let me know if you need further guidance.”
* “I am here to assist you if you have more questions.”

---

## 🎙️ VOICE OPTIMIZATION (CRITICAL)

Since your response will be **spoken aloud** (Text-to-Speech):

* **DO NOT** use Markdown formatting (No **bold**, *italics*, # headers, `code blocks`).
* **DO NOT** use bullet points with asterisks (*) or dashes (-). Instead, use natural connecting words like "Firstly, ... Secondly, ..." or numbered lists "1. ... 2. ..." if strictly necessary.
* **Keep sentences short** and rhythmic for natural breathing pauses.
* **Avoid long URLs** or complex numbers/units that are hard to listen to.

"""

QA_CHAIN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "{system_instructions}"),
    ("human", "Context: {context}\n\nQuestion: {question}")
])

class KrishiRAG:
    def __init__(self):
        # 1. Initialize Google Gemini LLM (Primary preference but currently disabled)
        google_api_key = os.getenv("GOOGLE_API_KEY")
        self.google_llm = None
        # We only try if it doesn't look like a placeholder
        if google_api_key and "your_api_key" not in google_api_key:
            try:
                # Note: Skipping heavy validation here to allow Groq fallback to kick in faster
                self.google_llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash", 
                    temperature=0.3,
                    google_api_key=google_api_key
                )
            except Exception:
                self.google_llm = None

        # 2. Initialize Groq as Primary working driver
        groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_llm = None
        try:
            if groq_api_key:
                print(f"🔄 Initializing Groq Driver...")
                self.groq_llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.3)
                print("✅ Groq Driver active.")
        except Exception as e:
            print(f"⚠️ Groq Init Error: {e}")

        # Choose the first working LLM
        self.llm = self.google_llm or self.groq_llm
        
        if self.google_llm:
             print("🛡️ Preferring Google Gemini engine.")
        elif self.groq_llm:
             print("🚀 Using Groq engine (Gemini API key appears restricted).")
        else:
             print("🛑 CRITICAL: No working AI engine found!")

        # 3. Initialize Embeddings
        self.embeddings = None
        if google_api_key and "your_api_key" not in google_api_key:
            try:
                self.embeddings = GoogleGenerativeAIEmbeddings(
                    model="gemini-embedding-001",
                    google_api_key=google_api_key
                )
                print("✅ Google Embeddings ready.")
            except Exception as e:
                print(f"⚠️ Embeddings Error: {e}")

        self.vector_store = None
        self.full_docs = []

    def load_data(self):
        """Loads data from the data/ directory and creates Document objects."""
        self.full_docs = [] # Reset docs
        
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        DATA_DIR = os.path.join(BASE_DIR, "../data")

        # 1. Load Schemes
        try:
            with open(os.path.join(DATA_DIR, "schemes/schemes.json"), "r") as f:
                schemes = json.load(f)
                for scheme in schemes:
                    content = f"Scheme: {scheme['scheme_name']}\nDescription: {scheme['description']}\nBenefits: {scheme['benefits']}\nEligibility: {scheme['eligibility']}"
                    if Document:
                        self.full_docs.append(Document(page_content=content, metadata={"source": "scheme"}))
            print("Loaded Schemes.")
        except Exception as e:
            print(f"Error loading schemes: {e}")

        # 2. Load Crops (Real CSV Logic)
        try:
            csv_path = os.path.join(DATA_DIR, "crops/crop_production.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                # Sample 1000 rows to avoid blowing up context window/quota in dev
                # In production, you'd chunk this intelligently or use a proper Vector DB
                sample_df = df.sample(n=min(len(df), 500), random_state=42)
                
                for _, row in sample_df.iterrows():
                    # Adjust column names based on actual Kaggle dataset keys
                    content = f"Crop: {row.get('Crop')}\nState: {row.get('State_Name')}\nDistrict: {row.get('District_Name')}\nSeason: {row.get('Season')}\nYield: {row.get('Yield')}"
                    if Document:
                        self.full_docs.append(Document(page_content=content, metadata={"source": "crop_stats"}))
                print(f"Loaded {len(sample_df)} Crop records.")
            else:
                print("Crop dataset not found. Please download from Kaggle.")
        except Exception as e:
            print(f"Error loading crops: {e}")
            
        # 3. Load Pests (Metadata CSV)
        try:
            pest_csv = os.path.join(DATA_DIR, "pests/pests.csv")
            if os.path.exists(pest_csv):
                 df_pests = pd.read_csv(pest_csv)
                 for _, row in df_pests.iterrows():
                     content = f"Pest: {row.get('pest_name')}\nDescription: {row.get('description')}\nControl: {row.get('control_measures')}"
                     if Document:
                         self.full_docs.append(Document(page_content=content, metadata={"source": "pest_info"}))
                 print(f"Loaded {len(df_pests)} Pest records.")
            else:
                 print("Pest dataset not found. Please download from Kaggle.")
        except Exception as e:
             print(f"Error loading pests: {e}")

        # 4. Load FAQs
        try:
            faq_path = os.path.join(DATA_DIR, "faqs/faqs.json")
            if os.path.exists(faq_path):
                with open(faq_path, "r") as f:
                    faqs = json.load(f)
                    for faq in faqs:
                        content = f"Question: {faq['question']}\nAnswer: {faq['answer']}"
                        if Document:
                            self.full_docs.append(Document(page_content=content, metadata={"source": "faq"}))
                print(f"Loaded {len(faqs)} FAQs.")
            else:
                 print("FAQ dataset not found.")
        except Exception as e:
            print(f"Error loading FAQs: {e}")

        print(f"Total Documents: {len(self.full_docs)}")

    def build_index(self):
        """Builds the FAISS index from loaded documents."""
        if not self.full_docs:
            print("No documents to index.")
            return
        
        if not self.embeddings:
            print("⚠️ Cannot build index: Embeddings are not initialized.")
            return

        print("Building Vector Store...")
        try:
            self.vector_store = FAISS.from_documents(self.full_docs, self.embeddings)
            self.vector_store.save_local("faiss_index")
            print("Vector Store built and saved.")
        except Exception as e:
            print(f"Error building vector store (Embeddings might be restricted): {e}")
            self.vector_store = None

    def load_index(self):
        """Loads the FAISS index from disk."""
        if not self.embeddings:
            return False
            
        if os.path.exists("faiss_index"):
            try:
                self.vector_store = FAISS.load_local("faiss_index", self.embeddings, allow_dangerous_deserialization=True)
                return True
            except Exception as e:
                print(f"Failed to load local index: {e}")
                return False
        return False

    def get_answer(self, query: str, language: str = "en", image_data: str = None):
        """Queries the RAG pipeline with optional multimodal (image) support."""
        
        # Map code to full language name
        lang_map = {
            "en": "English",
            "hi": "Hindi",
            "te": "Telugu"
        }
        target_lang = lang_map.get(language, "English")
        
        # Dynamic System Prompt injection
        lang_specific_instruction = f"""
        
---

## 🌐 LANGUAGE ENFORCEMENT (User Selected: {target_lang.upper()})

*   You MUST answer strictly in **{target_lang}**.
*   Even if the user asks in a different language, TRANSLATE your thought process and Output ONLY in **{target_lang}**.
*   **DO NOT** mix languages.
*   **DO NOT** ask the user to switch languages.
*   Your entire response must be in {target_lang}.
"""
        
        final_system_prompt = SYSTEM_INSTRUCTIONS + lang_specific_instruction

        # Handle Image Vision Query
        if image_data:
            print("📸 Image detected. Using Vision Model.")
            if not self.llm:
                 return "AI Assistant is currently unavailable (Missing API Key). Please contact administrator."
            
            try:
                # Switch to vision model temporarily for this request
                vision_llm = ChatGroq(
                    model_name="meta-llama/llama-4-maverick-17b-128e-instruct", 
                    temperature=0.3,
                    api_key=os.getenv("GROQ_API_KEY")
                )
                
                # Format message for multimodal input
                message = HumanMessage(
                    content=[
                        {"type": "text", "text": f"{final_system_prompt}\n\nUser Question: {query}"},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_data},
                        },
                    ],
                )
                response = vision_llm.invoke([message])
                return response.content
            except Exception as e:
                print(f"Vision Query Failed: {e}")
                return "I identified that you uploaded an image, but I ran into an error while processing it. Please try again with a clearer photo or text description."

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        # Fallback to pure LLM if retrieval is not available
        def invoke_with_fallback(chain_input, is_retrieval=False):
            # Try Primary LLM
            try:
                if is_retrieval:
                    retriever = self.vector_store.as_retriever()
                    current_chain = (
                        {"context": retriever | format_docs, "question": RunnablePassthrough(), "system_instructions": lambda x: final_system_prompt}
                        | QA_CHAIN_PROMPT
                        | self.llm
                        | StrOutputParser()
                    )
                    return current_chain.invoke(chain_input)
                else:
                    prompt = ChatPromptTemplate.from_messages([
                        ("system", "{system_instructions}"),
                        ("human", "{input}")
                    ])
                    current_chain = prompt | self.llm | StrOutputParser()
                    return current_chain.invoke({
                        "input": chain_input, 
                        "system_instructions": final_system_prompt
                    })
            except Exception as e:
                print(f"⚠️ Primary LLM Failed: {e}")
                # Try Groq Fallback if primary wasn't Groq
                if self.groq_llm and self.llm != self.groq_llm:
                    print("🔄 Retrying with Groq Fallback...")
                    try:
                        if is_retrieval:
                            retriever = self.vector_store.as_retriever()
                            fallback_chain = (
                                {"context": retriever | format_docs, "question": RunnablePassthrough(), "system_instructions": lambda x: final_system_prompt}
                                | QA_CHAIN_PROMPT
                                | self.groq_llm
                                | StrOutputParser()
                            )
                            return fallback_chain.invoke(chain_input)
                        else:
                            prompt = ChatPromptTemplate.from_messages([
                                ("system", "{system_instructions}"),
                                ("human", "{input}")
                            ])
                            fallback_chain = prompt | self.groq_llm | StrOutputParser()
                            return fallback_chain.invoke({
                                "input": chain_input, 
                                "system_instructions": final_system_prompt
                            })
                    except Exception as e2:
                        print(f"🛑 Groq Fallback also failed: {e2}")
                
                return "I am currently unable to answer due to an API connection issue. Please check your API key permissions."

        if not self.vector_store:
            print("Vector store not available. Using pure LLM.")
            if not self.llm:
                 return "AI Assistant is currently unavailable (Missing API Key). Please contact administrator."
            return invoke_with_fallback(query, is_retrieval=False)

        if not self.llm:
             return "AI Assistant is currently unavailable (Missing API Key). Please contact administrator."

        return invoke_with_fallback(query, is_retrieval=True)

# Global Instance
rag_engine = KrishiRAG()
