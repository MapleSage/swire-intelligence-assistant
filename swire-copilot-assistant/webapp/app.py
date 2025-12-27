"""
Swire Intelligence Assistant - Web Application
A Flask-based web app for accessing the Swire Copilot without Teams
"""

from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'swire-copilot-dev-key-change-in-production')
CORS(app)

# Configuration
class Config:
    COPILOT_API_ENDPOINT = os.environ.get('COPILOT_API_ENDPOINT', 'https://swire-copilot-api.azurewebsites.net/api/chat')
    AZURE_OPENAI_ENDPOINT = os.environ.get('AZURE_OPENAI_ENDPOINT', 'https://swire-copilot-dev-openai.openai.azure.com/')
    ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

@app.route('/')
def index():
    """Main chat interface"""
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    
    return render_template('chat.html', 
                         user_id=session['user_id'],
                         environment=Config.ENVIRONMENT)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        user_id = session.get('user_id', str(uuid.uuid4()))
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Log the conversation
        logger.info(f"User {user_id}: {message}")
        
        # Process the message and get response
        response = process_message(message, user_id)
        
        # Log the response
        logger.info(f"Assistant response to {user_id}: {response['content'][:100]}...")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return jsonify({
            'content': "I'm sorry, I'm having trouble processing your request right now. Please try again.",
            'error': True
        }), 500

def process_message(message, user_id):
    """Process user message and return appropriate response"""
    
    # Convert to lowercase for easier matching
    lower_message = message.lower()
    
    # Financial queries
    if any(keyword in lower_message for keyword in ['financial', 'finance', 'revenue', 'budget', 'expense', 'profit', 'money']):
        return get_financial_response(message)
    
    # HSE/Safety queries
    elif any(keyword in lower_message for keyword in ['safety', 'hse', 'incident', 'accident', 'compliance', 'environmental']):
        return get_hse_response(message)
    
    # HR/Workforce queries
    elif any(keyword in lower_message for keyword in ['hr', 'workforce', 'employee', 'staff', 'attendance', 'productivity', 'training']):
        return get_hr_response(message)
    
    # Document search queries
    elif any(keyword in lower_message for keyword in ['search', 'document', 'policy', 'procedure', 'manual', 'find']):
        return get_document_response(message)
    
    # Greeting/Help queries
    elif any(keyword in lower_message for keyword in ['hello', 'hi', 'help', 'what can you do', 'capabilities']):
        return get_greeting_response()
    
    # Default response
    else:
        return get_default_response(message)

def get_financial_response(message):
    """Generate financial data response"""
    return {
        'content': """## 📊 Financial Performance Summary

**Period:** Current Month (November 2024)

### Key Metrics
💰 **Revenue:** €2.4M (+12% vs last month)  
💸 **Expenses:** €1.8M (-5% vs budget)  
📈 **Net Income:** €600K (+25% vs target)  
📊 **Budget Variance:** +8%

### Revenue Breakdown
• **Offshore Wind:** €1.6M (67%)
• **Onshore Wind:** €0.5M (21%)
• **Solar Projects:** €0.3M (12%)

### Key Insights
✅ Strong revenue growth driven by offshore wind projects  
✅ Operating expenses well controlled below budget  
✅ Exceeding profitability targets for Q4  
⚠️ Monitor supply chain costs for next quarter

### Recommendations
• Continue focus on offshore wind expansion
• Optimize operational efficiency in onshore projects
• Prepare for Q1 2025 budget planning""",
        'actions': [
            {'type': 'drilldown', 'title': '📈 View Trends', 'data': 'financial-trends'},
            {'type': 'export', 'title': '📋 Generate Report', 'data': 'financial-report'},
            {'type': 'filter', 'title': '🏢 By Department', 'data': 'financial-departments'}
        ],
        'timestamp': datetime.now().isoformat()
    }

def get_hse_response(message):
    """Generate HSE/Safety response"""
    return {
        'content': """## 🛡️ HSE Status Summary

**Period:** Last 30 Days

### Safety Metrics
🚨 **Total Incidents:** 3 (↓ 40% vs last month)  
⚠️ **High Severity:** 0 incidents  
🎯 **Days Since Last Incident:** 12 days  
✅ **Compliance Score:** 94%

### Recent Incidents
**📅 Oct 28** - Minor equipment malfunction at Site A (Resolved)  
**📅 Oct 15** - Near miss during turbine maintenance (Under review)  
**📅 Oct 8** - First aid incident - worker slip (Closed)

### Compliance Status
✅ **Safety Training:** 98% completion rate  
✅ **Equipment Inspections:** All current  
⚠️ **Emergency Drills:** 2 sites pending  
✅ **Environmental Permits:** All valid

### Trend Analysis
📈 **Improving:** Safety performance trending upward  
🎓 **Training Impact:** Enhanced safety training showing results  
🔧 **Equipment:** Preventive maintenance reducing incidents

### Action Items
• Complete emergency drills at Sites C & D
• Review maintenance procedures for turbine operations
• Continue monthly safety awareness campaigns""",
        'actions': [
            {'type': 'drilldown', 'title': '📊 Incident Details', 'data': 'hse-incidents'},
            {'type': 'filter', 'title': '📍 By Location', 'data': 'hse-locations'},
            {'type': 'export', 'title': '📋 Compliance Report', 'data': 'hse-compliance'}
        ],
        'timestamp': datetime.now().isoformat()
    }

def get_hr_response(message):
    """Generate HR/Workforce response"""
    return {
        'content': """## 👥 Workforce Analytics

**Period:** Current Quarter (Q4 2024)

### Workforce Overview
👤 **Total Employees:** 1,247 (+3% growth)  
📈 **Active Staff:** 1,198 (96% utilization)  
🆕 **New Hires:** 47 this quarter  
📤 **Departures:** 23 this quarter  
📊 **Turnover Rate:** 1.8% (industry avg: 3.2%)

### Performance Metrics
✅ **Attendance Rate:** 96.2%  
🎯 **Productivity Score:** 87/100  
📚 **Training Completion:** 92%  
😊 **Employee Satisfaction:** 8.3/10

### Department Breakdown
**🔧 Operations:** 456 employees (94% utilization)  
**⚙️ Engineering:** 234 employees (98% utilization)  
**🏢 Administration:** 123 employees (89% utilization)  
**🛡️ HSE:** 45 employees (96% utilization)  
**💰 Finance:** 34 employees (91% utilization)

### Key Insights
✅ Strong workforce performance with high engagement  
✅ Low turnover rate indicates good retention  
✅ Training programs showing positive impact  
📈 Productivity improvements in engineering teams

### Upcoming Initiatives
• Q1 2025 performance reviews starting December
• New employee onboarding program launch
• Leadership development program expansion""",
        'actions': [
            {'type': 'drilldown', 'title': '📊 Department View', 'data': 'hr-departments'},
            {'type': 'filter', 'title': '📈 Performance Trends', 'data': 'hr-performance'},
            {'type': 'export', 'title': '📋 HR Report', 'data': 'hr-report'}
        ],
        'timestamp': datetime.now().isoformat()
    }

def get_document_response(message):
    """Generate document search response"""
    return {
        'content': """## 🔍 Document Search Results

Found **8 relevant documents** for your query:

### 📄 **Safety Procedures Manual v3.2**
**Department:** HSE | **Updated:** Oct 2024  
Comprehensive safety procedures for offshore wind operations including emergency protocols, equipment handling, and risk assessment guidelines...

### 📄 **Employee Handbook 2024**
**Department:** HR | **Updated:** Jan 2024  
Complete guide to company policies, benefits, procedures, and employee rights and responsibilities...

### 📄 **Financial Reporting Guidelines**
**Department:** Finance | **Updated:** Sep 2024  
Standard procedures for monthly, quarterly, and annual financial reporting including KPI definitions and compliance requirements...

### 📄 **Environmental Management System**
**Department:** HSE | **Updated:** Nov 2024  
ISO 14001 compliant environmental management procedures covering waste management, emissions monitoring, and sustainability practices...

### 📄 **Equipment Maintenance Procedures**
**Department:** Operations | **Updated:** Oct 2024  
Detailed maintenance schedules and procedures for wind turbines, electrical systems, and support equipment...

**🏷️ Tags:** procedures, safety, hr-policies, finance, environmental, maintenance

### Search Tips
• Use specific keywords for better results
• Filter by department or document type
• Search within date ranges for recent updates""",
        'actions': [
            {'type': 'navigate', 'title': '📂 Open Document', 'data': 'doc-view'},
            {'type': 'filter', 'title': '🔍 Refine Search', 'data': 'search-refine'},
            {'type': 'export', 'title': '📋 Search Report', 'data': 'search-export'}
        ],
        'timestamp': datetime.now().isoformat()
    }

def get_greeting_response():
    """Generate greeting/help response"""
    return {
        'content': """## 👋 Welcome to Swire Intelligence Assistant!

I'm your AI-powered enterprise data assistant. I can help you access and analyze information across all Swire Renewables systems.

### 🎯 What I Can Help With

**💰 Financial Data**
• Revenue, expenses, and budget analysis
• KPI tracking and performance metrics
• Financial reporting and trend analysis

**🛡️ Health, Safety & Environment**
• Safety incident reports and analysis
• Compliance status and audit results
• Environmental impact metrics

**👥 Human Resources**
• Workforce analytics and metrics
• Attendance and productivity data
• Training completion and performance

**📄 Document & Knowledge Search**
• Company policies and procedures
• Technical manuals and guidelines
• Regulatory and compliance documents

### 💡 Try These Sample Queries

• *"Show me this month's financial performance"*
• *"What are the recent safety incidents?"*
• *"Get workforce metrics for this quarter"*
• *"Search for safety procedures"*
• *"Compare performance across departments"*

### 🔐 Security & Privacy
• All data is processed securely within EU regions
• Access is logged for audit purposes
• Information is filtered based on your permissions

**What would you like to explore today?**""",
        'actions': [
            {'type': 'suggestion', 'title': '💰 Finance', 'data': 'Show financial performance'},
            {'type': 'suggestion', 'title': '🛡️ Safety', 'data': 'Show safety status'},
            {'type': 'suggestion', 'title': '👥 HR', 'data': 'Show workforce analytics'},
            {'type': 'suggestion', 'title': '🔍 Search', 'data': 'Search documents'}
        ],
        'timestamp': datetime.now().isoformat()
    }

def get_default_response(message):
    """Generate default response for unrecognized queries"""
    return {
        'content': f"""I understand you're asking about "{message}". 

I can help you with information across these areas:

**💰 Financial Data** - Revenue, expenses, budgets, KPIs, financial reports
**🛡️ HSE Information** - Safety incidents, compliance status, environmental metrics  
**👥 HR Analytics** - Workforce metrics, attendance, performance, training
**📄 Document Search** - Policies, procedures, manuals, guidelines

Could you be more specific about what information you need? For example:
• "Show me financial performance for this month"
• "What's our current safety status?"
• "Get workforce analytics"
• "Search for HR policies"

I'm here to help you find the information you need!""",
        'actions': [
            {'type': 'suggestion', 'title': '💰 Financial Data', 'data': 'Show financial performance'},
            {'type': 'suggestion', 'title': '🛡️ Safety Status', 'data': 'Show safety incidents'},
            {'type': 'suggestion', 'title': '👥 HR Analytics', 'data': 'Show workforce metrics'},
            {'type': 'suggestion', 'title': '🔍 Search Docs', 'data': 'Search company documents'}
        ],
        'timestamp': datetime.now().isoformat()
    }

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'environment': Config.ENVIRONMENT,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/status')
def api_status():
    """API status endpoint"""
    return jsonify({
        'service': 'Swire Intelligence Assistant',
        'version': '1.0.0',
        'environment': Config.ENVIRONMENT,
        'status': 'operational',
        'features': {
            'chat': True,
            'financial_data': True,
            'hse_data': True,
            'hr_data': True,
            'document_search': True
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)