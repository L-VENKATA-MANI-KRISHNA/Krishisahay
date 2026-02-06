import langchain.chains
print("langchain.chains dir:", dir(langchain.chains))
try:
    from langchain.chains import RetrievalQA
    print("RetrievalQA found in langchain.chains")
except ImportError:
    print("RetrievalQA NOT found in langchain.chains")
    try:
        from langchain.chains.retrieval_qa.base import RetrievalQA
        print("RetrievalQA found in langchain.chains.retrieval_qa.base")
    except ImportError:
        print("RetrievalQA NOT found in langchain.chains.retrieval_qa.base")
