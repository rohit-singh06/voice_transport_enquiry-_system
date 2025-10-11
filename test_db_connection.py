
"""
Test database connection with detailed error reporting
"""

from sqlalchemy import create_engine, text
import sys

def test_connection():
    print("🔍 Testing database connection...")
    
    # Connection string from app.py
    connection_string = "postgresql+psycopg2://postgres:rohit@localhost:5432/transport_db"
    print(f"Connection string: {connection_string}")
    
    try:
        # Create engine
        print("📡 Creating database engine...")
        engine = create_engine(connection_string)
        
        # Test connection
        print("🔌 Testing connection...")
        with engine.connect() as conn:
            print("✅ Connection successful!")
            
            # Test basic query
            print("📊 Testing basic query...")
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"PostgreSQL version: {version}")
            
            # Check if database exists
            print("🗄️ Checking if transport_db database exists...")
            result = conn.execute(text("SELECT current_database();"))
            current_db = result.fetchone()[0]
            print(f"Current database: {current_db}")
            
            # Check if required tables exist
            print("📋 Checking for required tables...")
            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('stations', 'routes', 'schedules');
            """)
            result = conn.execute(tables_query)
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                print(f"✅ Found tables: {', '.join(tables)}")
            else:
                print("⚠️ No required tables found. You may need to create them.")
                
            # Test a sample query
            print("🔍 Testing sample query...")
            try:
                sample_query = text("SELECT COUNT(*) FROM stations;")
                result = conn.execute(sample_query)
                count = result.fetchone()[0]
                print(f"✅ Stations table has {count} records")
            except Exception as e:
                print(f"⚠️ Could not query stations table: {e}")
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Check if PostgreSQL is running")
        print("2. Verify username 'postgres' and password 'rohit'")
        print("3. Check if database 'transport_db' exists")
        print("4. Verify PostgreSQL is listening on port 5432")
        return False
    
    return True

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
