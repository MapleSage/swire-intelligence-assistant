from flask import Flask, render_template_string, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

# Simple HTML template embedded in the Python file
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Swire Intelligence Assistant</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #0078d4; color: white; padding: 20px; text-align: center; }
        .chat { height: 400px; overflow-y: auto; padding: 20px; border-bottom: 1px solid #eee; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user { background: #e3f2fd; text-align: right; }
        .assistant { background: #f1f8e9; }
        .input-area { padding: 20px; display: flex; gap: 10px; }
        .input-area input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .input-area button { padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .suggestions { padding: 0 20px 20px; display: flex; gap: 10px; flex-wrap: wrap; }
        .suggestion { padding: 8px 15px; background: #e3f2fd; border: 1px solid #0078d4; color: #0078d4; border-radius: 20px; cursor: pointer; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Swire Intelligence Assistant</h1>
            <p>Your AI-powered enterprise data assistant</p>
        </div>
        
        <div class="chat" id="chat">
            <div class="message assistant">
                <strong>Welcome!</strong><br>
                I can help you with:<br>
                💰 Financial data and reports<br>
                🛡️ HSE incidents and compliance<br>
                👥 HR analytics and workforce data<br>
                📄 Document search and policies<br><br>
                What would you like to know?
            </div>
        </div>
        
        <div class="suggestions">
            <div class="suggestion" onclick="sendMessage('Show financial performance')">📊 Financial Summary</div>
            <div class="suggestion" onclick="sendMessage('Recent safety incidents')">🛡️ Safety Status</div>
            <div class="suggestion" onclick="sendMessage('Workforce analytics')">👥 HR Analytics</div>
            <div class="suggestion" onclick="sendMessage('Search documents')">🔍 Search Docs</div>
        </div>
        
        <div class="input-area">
            <input type="text" id="messageInput" placeholder="Ask me about enterprise data..." onkeypress="if(event.key==='Enter') sendMessage()">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        function addMessage(text, isUser) {
            const chat = document.getElementById('chat');
            const div = document.createElement('div');
            div.className = 'message ' + (isUser ? 'user' : 'assistant');
            div.innerHTML = text;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }

        function sendMessage(text) {
            const input = document.getElementById('messageInput');
            const message = text || input.value.trim();
            if (!message) return;
            
            addMessage(message, true);
            input.value = '';
            
            fetch('/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: message})
            })
            .then(r => r.json())
            .then(data => addMessage(data.response, false))
            .catch(e => addMessage('Sorry, there was an error processing your request.', false));
        }
    </script>
</body>
</html>
'''

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').lower()
    
    # Simple response logic
    if 'financial' in message or 'revenue' in message or 'budget' in message:
        response = """<strong>📊 Financial Summary</strong><br>
        <strong>Revenue:</strong> €2.4M (+12% vs last month)<br>
        <strong>Expenses:</strong> €1.8M (-5% vs budget)<br>
        <strong>Net Income:</strong> €600K (+25% vs target)<br>
        <strong>Budget Variance:</strong> +8%<br><br>
        <em>Strong performance driven by offshore wind projects</em>"""
        
    elif 'safety' in message or 'hse' in message or 'incident' in message:
        response = """<strong>🛡️ HSE Status</strong><br>
        <strong>Total Incidents:</strong> 3 (↓40% vs last month)<br>
        <strong>High Severity:</strong> 0 incidents<br>
        <strong>Days Since Last:</strong> 12 days<br>
        <strong>Compliance Score:</strong> 94%<br><br>
        <em>Safety performance improving with enhanced training</em>"""
        
    elif 'workforce' in message or 'hr' in message or 'employee' in message:
        response = """<strong>👥 Workforce Analytics</strong><br>
        <strong>Total Employees:</strong> 1,247 (+3% growth)<br>
        <strong>Attendance Rate:</strong> 96.2%<br>
        <strong>Productivity Score:</strong> 87/100<br>
        <strong>Training Completion:</strong> 92%<br><br>
        <em>Strong workforce performance with high engagement</em>"""
        
    elif 'search' in message or 'document' in message or 'policy' in message:
        response = """<strong>🔍 Document Search</strong><br>
        Found <strong>5 relevant documents:</strong><br>
        📄 Safety Procedures Manual v3.2<br>
        📄 Employee Handbook 2024<br>
        📄 Financial Reporting Guidelines<br>
        📄 Environmental Management System<br>
        📄 Equipment Maintenance Procedures<br><br>
        <em>Use specific keywords for better results</em>"""
        
    else:
        response = """I can help you with:<br>
        💰 <strong>Financial data</strong> - revenue, expenses, budgets<br>
        🛡️ <strong>HSE information</strong> - safety incidents, compliance<br>
        👥 <strong>HR analytics</strong> - workforce metrics, attendance<br>
        📄 <strong>Document search</strong> - policies, procedures<br><br>
        Try asking: "Show financial performance" or "Recent safety incidents"
        """
    
    return jsonify({'response': response})

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)