import requests
from langchain.tools import Tool

def get_finance_data(query_params: str) -> str:
    """Get financial data from mock API"""
    try:
        response = requests.get("https://dummyjson.com/products")
        data = response.json()
        
        # Mock financial summary
        total_revenue = sum(p['price'] for p in data['products'][:10]) * 1000
        monthly_expenses = total_revenue * 0.7
        
        return f"Monthly Revenue: ${total_revenue:,.2f}, Monthly Expenses: ${monthly_expenses:,.2f}, Net Profit: ${total_revenue - monthly_expenses:,.2f}"
    except Exception as e:
        return f"Error fetching finance data: {str(e)}"

def get_tools():
    return [
        Tool(
            name="Finance Data",
            func=get_finance_data,
            description="Get financial data including revenue, expenses, and profit summaries"
        )
    ]