#!/usr/bin/env python3
"""Basic test to verify the agent setup"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.tools.finance import get_finance_data
from src.tools.hse import get_hse_reports
from src.tools.db_connector import db_connector

def test_tools():
    print("Testing Finance Tool:")
    finance_result = get_finance_data("")
    print(f"✓ {finance_result}\n")
    
    print("Testing HSE Tool:")
    hse_result = get_hse_reports("")
    print(f"✓ {hse_result}\n")
    
    print("Testing Database Tool:")
    db_result = db_connector.execute_query("SELECT * FROM employees LIMIT 5")
    print(f"✓ {db_result}\n")
    
    print("All tools working! 🚀")

if __name__ == "__main__":
    test_tools()