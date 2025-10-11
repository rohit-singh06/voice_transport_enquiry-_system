
"""
Test Flask app startup and database connection
"""

import sys
import traceback

def test_flask_startup():
    print("🚀 Testing Flask app startup...")
    
    try:
        # Import Flask app
        print("📦 Importing Flask app...")
        from app import app, engine
        
        print("✅ Flask app imported successfully")
        
        # Check database engine
        if engine is None:
            print("❌ Database engine is None - connection failed during import")
            return False
        else:
            print("✅ Database engine created successfully")
        
        # Test database connection
        print("🔌 Testing database connection through Flask app...")
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection working through Flask app")
        
        # Test a simple route
        print("🌐 Testing Flask routes...")
        with app.test_client() as client:
            response = client.get('/api/health')
            print(f"Health endpoint status: {response.status_code}")
            if response.status_code == 200:
                print("✅ Health endpoint working")
                print(f"Response: {response.get_json()}")
            else:
                print("❌ Health endpoint failed")
                return False
        
        print("🎉 All tests passed! Flask app is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error during Flask app testing: {e}")
        print("\n📋 Full traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_flask_startup()
    sys.exit(0 if success else 1)
