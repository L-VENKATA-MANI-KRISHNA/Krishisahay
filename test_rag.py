import sys
import os

# Add backend directory to path so we can import rag
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from dotenv import load_dotenv
load_dotenv('backend/.env')

try:
    from rag import rag_engine
    
    print("Loading Data...")
    rag_engine.load_data()
    
    print("\nBuilding Index (InMemory)...")
    rag_engine.build_index()
    
    test_queries = [
        "How to register for PM Kisan Samman Nidhi?",
        "What is the best time to sow Wheat?",
        "Tell me about soil health card."
    ]
    
    print("\n--- Testing FAQs ---")
    for query in test_queries:
        print(f"\nQuestion: {query}")
        # Note: We are not mocking the LLM here, so if GOOGLE_API_KEY is missing, it might fail or return a partial response.
        # But for FAQs, the retrieval part is what we want to test primarily.
        try:
            answer = rag_engine.get_answer(query)
            print(f"Answer: {answer}")
        except Exception as e:
            print(f"Error getting answer: {e}")
            
except ImportError as e:
    print(f"Import Error: {e}")
except Exception as e:
    print(f"General Error: {e}")
