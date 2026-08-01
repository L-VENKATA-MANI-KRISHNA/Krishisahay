import requests
import json

def test_telugu_response():
    url = "http://localhost:8000/query"
    payload = {
        "query": "What is PM-KISAN?",
        "api_key": "test_key",
        "language": "te"
    }
    
    try:
        print("Sending Telugu request to backend...")
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        answer = data.get("answer", "")
        
        print("\n--- Response ---")
        print(answer)
        print("----------------")
        
        # Simple check for Telugu Unicode range (0C00–0C7F)
        telugu_chars = [char for char in answer if '\u0C00' <= char <= '\u0C7F']
        
        if len(telugu_chars) > 10:
            print(f"✅ PASSED: Detected {len(telugu_chars)} Telugu characters.")
        else:
            print("❌ FAILED: Response does not appear to contain significant Telugu text.")
             
    except Exception as e:
        print(f"Error testing response: {e}")

if __name__ == "__main__":
    test_telugu_response()
