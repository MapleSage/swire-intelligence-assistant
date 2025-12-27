#!/usr/bin/env python3
"""
Swire Intelligence Assistant - Web Application Runner
Simple script to run the Flask web application locally
"""

import os
import sys
from app import app

def main():
    """Main function to run the Flask application"""
    
    # Set environment variables if not already set
    if not os.environ.get('FLASK_ENV'):
        os.environ['FLASK_ENV'] = 'development'
    
    if not os.environ.get('FLASK_DEBUG'):
        os.environ['FLASK_DEBUG'] = 'True'
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5000))
    
    print("=" * 60)
    print("🤖 Swire Intelligence Assistant - Web Application")
    print("=" * 60)
    print(f"🌐 Starting server on http://localhost:{port}")
    print(f"📱 Access from mobile: http://[your-ip]:{port}")
    print("🔧 Environment: Development")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        # Run the Flask application
        app.run(
            host='0.0.0.0',  # Allow external connections
            port=port,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down Swire Intelligence Assistant...")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()