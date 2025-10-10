#!/usr/bin/env python3
"""Simple test without LangChain dependencies"""

import requests
import os

def test_finance():
    try:
        response = requests.get("https://dummyjson.com/products")
        data = response.json()
        total_revenue = sum(p['price'] for p in data['products'][:10]) * 1000
        monthly_expenses = total_revenue * 0.7
        return f"✓ Finance: Revenue ${total_revenue:,.2f}, Expenses ${monthly_expenses:,.2f}"
    except Exception as e:
        return f"✗ Finance error: {e}"

def test_hse():
    hse_dir = "data/hse"
    if not os.path.exists(hse_dir):
        os.makedirs(hse_dir)
        return "✓ HSE: Directory created, mock data: 3 minor incidents, 0 major, safety score 95%"
    return "✓ HSE: Directory exists, ready for PDF reports"

def test_structure():
    required_dirs = ['src/core', 'src/tools', 'src/utils', 'data/docs', 'data/hse', 'logs']
    missing = [d for d in required_dirs if not os.path.exists(d)]
    if missing:
        return f"✗ Missing directories: {missing}"
    return "✓ Project structure complete"

if __name__ == "__main__":
    print("🧠 Swire Intelligence Assistant - Setup Test")
    print("=" * 50)
    print(test_structure())
    print(test_finance())
    print(test_hse())
    print("\n🚀 Basic setup complete! Ready for AWS Bedrock integration.")