import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
import json
import glob

# Load Environment Variables (Ensure GOOGLE_API_KEY is set in .env)
# from dotenv import load_dotenv
# load_dotenv()

import pandas as pd

class KrishiRAG:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
        self.vector_store = None
        # self.llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3)
        self.llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.3)
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
        if os.path.exists("faiss_index"):
            self.vector_store = FAISS.load_local("faiss_index", self.embeddings, allow_dangerous_deserialization=True)
            return True
        return False

    def get_answer(self, query: str, language: str = "en"):
        """Queries the RAG pipeline."""
        # Fallback to pure LLM if retrieval is not available
        if not self.vector_store:
            print("Vector store not available. Using pure LLM.")
            prompt = ChatPromptTemplate.from_template(
                """You are KisanMitra, an agricultural AI assistant.
                Answer the following question to the best of your ability.
                Question: {input}"""
            )
            try:
                chain = prompt | self.llm | StrOutputParser()
                return chain.invoke({"input": query})
            except Exception as e:
                print(f"LLM Fallback Failed: {e}")
                return "I am currently unable to answer due to an API connection issue. Please check your API key permissions."

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | QA_CHAIN_PROMPT
            | self.llm
            | StrOutputParser()
        )
        
        return chain.invoke(query)

# Global Instance
rag_engine = KrishiRAG()
