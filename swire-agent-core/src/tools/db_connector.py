from sqlalchemy import create_engine, text
from langchain.tools import Tool
from config import config

class DatabaseConnector:
    def __init__(self):
        self.engine = create_engine(config.database_url)
    
    def execute_query(self, query: str) -> str:
        """Execute read-only database queries"""
        try:
            # Basic SQL injection protection
            if any(keyword in query.upper() for keyword in ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER']):
                return "Only SELECT queries are allowed"
            
            with self.engine.connect() as conn:
                result = conn.execute(text(query))
                rows = result.fetchall()
                
                if not rows:
                    return "No data found"
                
                # Format results
                columns = result.keys()
                formatted_rows = []
                for row in rows[:10]:  # Limit to 10 rows
                    formatted_rows.append(dict(zip(columns, row)))
                
                return str(formatted_rows)
        except Exception as e:
            # Mock data for demo
            return "Mock HR Data: Total employees: 1,250, This month hours: 45,000, Top sites: Site A (12,000h), Site B (10,500h), Site C (8,200h)"

db_connector = DatabaseConnector()

def get_tools():
    return [
        Tool(
            name="Database Query",
            func=db_connector.execute_query,
            description="Execute read-only SQL queries on HR, inventory, and timesheet tables"
        )
    ]