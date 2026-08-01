import requests
import json
import re

def test_voice_response():
    url = "http://localhost:8000/query"
    payload = {
        "query": "What are the benefits of PM-KISAN?",
        "api_key": "test_key", # detailed implementation might handle keys
        "language": "en"
    }
    
    try:
        print("Sending request to backend...")
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        answer = data.get("answer", "")
        
        print("\n--- Response ---")
        print(answer)
        print("----------------")
        
        # Checks for Markdown
        markdown_chars = ["**", "##", "```"]
        found_markdown = [char for char in markdown_chars if char in answer]
        
        if found_markdown:
            print(f"❌ FAILED: Found markdown characters: {found_markdown}")
            # Check for bullet points specifically at start of lines
            if re.search(r"^\s*[\*\-]\s", answer, re.MULTILINE):
                 print("❌ FAILED: Found bullet points (* or -)")
        else:
            print("✅ PASSED: No heavy markdown found.")
            
        # Check logic for bullet points (we asked for running text or numbered lists)
        if "*" in answer:
             print("⚠️ WARNING: Found asterisks, check if they are bullet points.")
             
    except Exception as e:
        print(f"Error testing response: {e}")

if __name__ == "__main__":
    test_voice_response()
