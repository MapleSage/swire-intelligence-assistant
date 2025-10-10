"""Simple tools without LangChain dependencies for testing"""

def get_finance_data(query_params=""):
    """Get financial data from mock API"""
    return "Monthly Financial Summary: Revenue $486,900, Expenses $340,830, Net Profit $146,070 (30% margin)"

def get_hse_reports(query=""):
    """Read HSE reports and extract incident summaries"""
    return "HSE Summary: 3 minor incidents this month, 0 major incidents, safety score: 95%. PPE compliance: 100%"

def execute_db_query(query=""):
    """Execute database queries"""
    return "HR Summary: Total 45,000 hours this month. Top sites: Site A (12,000h), Site B (10,500h), Site C (8,200h)"

def search_knowledge(query=""):
    """Search knowledge base"""
    return "Knowledge Base: Safety guidelines require PPE at all times. Wind turbine maintenance scheduled quarterly. Emergency procedures posted at all sites."

# Mock database connector
class MockDBConnector:
    def execute_query(self, query):
        return execute_db_query(query)

db_connector = MockDBConnector()