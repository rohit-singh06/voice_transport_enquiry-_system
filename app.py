from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from sqlalchemy import create_engine, text
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for web frontend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection with error handling
try:
    engine = create_engine("postgresql+psycopg2://postgres:rohit@localhost:5432/transport_db")
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    engine = None

@app.route('/')
def home():
    try:
        return render_template('index.html')
    except Exception:
        return "Voice-Based Transport Enquiry System Running! (No template found)", 200

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    if engine is None:
        return jsonify({"status": "error", "message": "Database not connected"}), 500
    return jsonify({"status": "ok", "message": "System is running"})

@app.route('/api/nextbus')
def next_bus():
    """Get next bus from source to destination"""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    source = request.args.get('source', '').strip()
    destination = request.args.get('destination', '').strip()
    
    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400
    
    try:
        query = text("""
            SELECT s.operator, s.departure_time, s.arrival_time, r.distance_km
            FROM schedules s
            JOIN routes r ON s.route_id = r.route_id
            JOIN stations src ON r.source_station_id = src.station_id
            JOIN stations dst ON r.destination_station_id = dst.station_id
            WHERE src.station_name ILIKE :src
            AND dst.station_name ILIKE :dst
            AND r.transport_type = 'bus'
            ORDER BY s.departure_time LIMIT 1;
        """)
        with engine.connect() as conn:
            result = conn.execute(query, {"src": f"%{source}%", "dst": f"%{destination}%"}).fetchone()
            if result:
                # Calculate estimated fare based on distance (₹2 per km for bus)
                estimated_fare = float(result[3]) * 2 if result[3] else 0
                return jsonify({
                    "operator": result[0],
                    "departure_time": str(result[1]),
                    "arrival_time": str(result[2]),
                    "fare": estimated_fare,
                    "transport_type": "bus",
                    "distance_km": float(result[3]) if result[3] else 0
                })
            else:
                return jsonify({"message": "No bus found for this route"})
    except Exception as e:
        logger.error(f"Error in next_bus: {e}")
        return jsonify({"error": "Database query failed"}), 500

@app.route('/api/nexttrain')
def next_train():
    """Get next train from source to destination"""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    source = request.args.get('source', '').strip()
    destination = request.args.get('destination', '').strip()
    
    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400
    
    try:
        query = text("""
            SELECT s.operator, s.departure_time, s.arrival_time, r.distance_km
            FROM schedules s
            JOIN routes r ON s.route_id = r.route_id
            JOIN stations src ON r.source_station_id = src.station_id
            JOIN stations dst ON r.destination_station_id = dst.station_id
            WHERE src.station_name ILIKE :src
            AND dst.station_name ILIKE :dst
            AND r.transport_type = 'train'
            ORDER BY s.departure_time LIMIT 1;
        """)
        with engine.connect() as conn:
            result = conn.execute(query, {"src": f"%{source}%", "dst": f"%{destination}%"}).fetchone()
            if result:
                # Calculate estimated fare based on distance (₹3 per km for train)
                estimated_fare = float(result[3]) * 3 if result[3] else 0
                return jsonify({
                    "operator": result[0],
                    "departure_time": str(result[1]),
                    "arrival_time": str(result[2]),
                    "fare": estimated_fare,
                    "transport_type": "train",
                    "distance_km": float(result[3]) if result[3] else 0
                })
            else:
                return jsonify({"message": "No train found for this route"})
    except Exception as e:
        logger.error(f"Error in next_train: {e}")
        return jsonify({"error": "Database query failed"}), 500

@app.route('/api/search')
def search_transport():
    """Search for any transport (bus or train) from source to destination"""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    source = request.args.get('source', '').strip()
    destination = request.args.get('destination', '').strip()
    transport_type = request.args.get('type', '').strip().lower()
    
    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400
    
    try:
        # Build query based on transport type
        if transport_type in ['bus', 'train']:
            type_filter = f"AND r.transport_type = '{transport_type}'"
        else:
            type_filter = ""
        
        query = text(f"""
            SELECT s.operator, s.departure_time, s.arrival_time, r.distance_km, r.transport_type
            FROM schedules s
            JOIN routes r ON s.route_id = r.route_id
            JOIN stations src ON r.source_station_id = src.station_id
            JOIN stations dst ON r.destination_station_id = dst.station_id
            WHERE src.station_name ILIKE :src
            AND dst.station_name ILIKE :dst
            {type_filter}
            ORDER BY s.departure_time;
        """)
        
        with engine.connect() as conn:
            results = conn.execute(query, {"src": f"%{source}%", "dst": f"%{destination}%"}).fetchall()
            if results:
                transport_list = []
                for result in results:
                    # Calculate estimated fare based on transport type
                    fare_rate = 3 if result[4] == 'train' else 2  # ₹3/km for train, ₹2/km for bus
                    estimated_fare = float(result[3]) * fare_rate if result[3] else 0
                    transport_list.append({
                        "operator": result[0],
                        "departure_time": str(result[1]),
                        "arrival_time": str(result[2]),
                        "fare": estimated_fare,
                        "transport_type": result[4],
                        "distance_km": float(result[3]) if result[3] else 0
                    })
                return jsonify({"results": transport_list})
            else:
                return jsonify({"message": "No transport found for this route"})
    except Exception as e:
        logger.error(f"Error in search_transport: {e}")
        return jsonify({"error": "Database query failed"}), 500

@app.route('/api/fare')
def get_fare():
    """Get fare information for a specific route"""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    source = request.args.get('source', '').strip()
    destination = request.args.get('destination', '').strip()
    transport_type = request.args.get('type', '').strip().lower()
    
    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400
    
    try:
        query = text("""
            SELECT r.distance_km, r.transport_type, s.operator
            FROM schedules s
            JOIN routes r ON s.route_id = r.route_id
            JOIN stations src ON r.source_station_id = src.station_id
            JOIN stations dst ON r.destination_station_id = dst.station_id
            WHERE src.station_name ILIKE :src
            AND dst.station_name ILIKE :dst
            AND (:transport_type = '' OR r.transport_type = :transport_type)
            ORDER BY r.distance_km;
        """)
        
        with engine.connect() as conn:
            results = conn.execute(query, {
                "src": f"%{source}%", 
                "dst": f"%{destination}%",
                "transport_type": transport_type
            }).fetchall()
            
            if results:
                fare_info = []
                for result in results:
                    # Calculate estimated fare based on transport type
                    fare_rate = 3 if result[1] == 'train' else 2  # ₹3/km for train, ₹2/km for bus
                    estimated_fare = float(result[0]) * fare_rate if result[0] else 0
                    fare_info.append({
                        "fare": estimated_fare,
                        "transport_type": result[1],
                        "operator": result[2],
                        "distance_km": float(result[0]) if result[0] else 0
                    })
                return jsonify({"fares": fare_info})
            else:
                return jsonify({"message": "No fare information found for this route"})
    except Exception as e:
        logger.error(f"Error in get_fare: {e}")
        return jsonify({"error": "Database query failed"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
