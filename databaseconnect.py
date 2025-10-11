from sqlalchemy import create_engine, text

# Connect to your PostgreSQL database
engine = create_engine("postgresql+psycopg2://postgres:rohit@localhost:5432/transport_db")

# Test connection
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM cities;"))
    for row in result:
        print(row)
