import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import pickle
import PyPDF2

class RAGPipeline:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = None
        self.documents = []
        self.index_path = "data/vector_index"
        self._load_or_create_index()
    
    def _load_documents(self):
        docs_dir = "data/docs"
        documents = []
        
        if not os.path.exists(docs_dir):
            os.makedirs(docs_dir)
            return ["Sample document: Swire Renewables operational guidelines and safety protocols."]
        
        for filename in os.listdir(docs_dir):
            if filename.endswith('.pdf'):
                try:
                    with open(os.path.join(docs_dir, filename), 'rb') as file:
                        reader = PyPDF2.PdfReader(file)
                        text = ""
                        for page in reader.pages[:5]:  # First 5 pages
                            text += page.extract_text()
                        documents.append(f"{filename}: {text[:1000]}")
                except:
                    continue
            elif filename.endswith('.txt'):
                with open(os.path.join(docs_dir, filename), 'r') as file:
                    documents.append(f"{filename}: {file.read()[:1000]}")
        
        return documents if documents else ["Sample document: Swire Renewables operational guidelines and safety protocols."]
    
    def _load_or_create_index(self):
        if os.path.exists(f"{self.index_path}.faiss"):
            self.index = faiss.read_index(f"{self.index_path}.faiss")
            with open(f"{self.index_path}.pkl", 'rb') as f:
                self.documents = pickle.load(f)
        else:
            self._create_index()
    
    def _create_index(self):
        self.documents = self._load_documents()
        embeddings = self.model.encode(self.documents)
        
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings.astype('float32'))
        
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        faiss.write_index(self.index, f"{self.index_path}.faiss")
        with open(f"{self.index_path}.pkl", 'wb') as f:
            pickle.dump(self.documents, f)
    
    def search_knowledge_base(self, query: str, top_k: int = 3) -> str:
        if not self.index:
            return "Knowledge base not initialized"
        
        query_embedding = self.model.encode([query]).astype('float32')
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.documents):
                results.append(f"Result {i+1}: {self.documents[idx][:300]}...")
        
        return "\n".join(results) if results else "No relevant documents found"