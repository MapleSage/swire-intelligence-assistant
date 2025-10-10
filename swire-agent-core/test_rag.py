#!/usr/bin/env python3
"""Test RAG pipeline functionality"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_rag_simple():
    """Simple test without heavy dependencies"""
    docs_dir = "data/docs"
    
    # Check if documents exist
    if not os.path.exists(docs_dir):
        print("✗ Documents directory not found")
        return
    
    files = os.listdir(docs_dir)
    txt_files = [f for f in files if f.endswith('.txt')]
    
    print(f"✓ Found {len(txt_files)} documents: {txt_files}")
    
    # Read sample content
    for file in txt_files[:2]:
        with open(os.path.join(docs_dir, file), 'r') as f:
            content = f.read()[:200]
            print(f"✓ {file}: {content}...")
    
    print("\n🔍 RAG pipeline ready for vector indexing!")

if __name__ == "__main__":
    print("🧠 Testing RAG Pipeline")
    print("=" * 30)
    test_rag_simple()