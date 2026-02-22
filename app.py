from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import logging
from datetime import datetime
import secrets
import re
import os

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # Generate a secret key for sessions
CORS(app)  # Enable CORS for web frontend
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_ADMIN_EMAILS = "admin@transport.com,rohitmahargain@gmail.com"
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.environ.get("ADMIN_EMAILS", DEFAULT_ADMIN_EMAILS).split(",")
    if email.strip()
}
try:
    engine = create_engine("postgresql+psycopg2://postgres:rohit@localhost:5432/transport_db")
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    engine = None


def is_admin_user():
    return 'email' in session and session['email'].lower() in ADMIN_EMAILS


def admin_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not is_admin_user():
            if request.path.startswith('/api/'):
                return jsonify({"error": "Admin access required"}), 403
            if 'user_id' not in session:
                return redirect(url_for('login'))
            return redirect(url_for('home'))
        return view_func(*args, **kwargs)
    return wrapper

# ========== AUTHENTICATION ROUTES ==========

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        try:
            query = text("SELECT user_id, email, password_hash, language_preference, first_name FROM users WHERE email = :email AND is_active = TRUE")
            with engine.connect() as conn:
                user = conn.execute(query, {"email": email}).fetchone()
                
                if user and check_password_hash(user[2], password):
                    # Update last login
                    update_query = text("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = :user_id")
                    conn.execute(update_query, {"user_id": user[0]})
                    conn.commit()
                    
                    # Create session
                    session['user_id'] = user[0]
                    session['email'] = user[1]
                    session['language'] = user[3] or 'en'
                    session['name'] = user[4] or email
                    
                    is_admin = user[1].lower() in ADMIN_EMAILS
                    return jsonify({
                        "success": True,
                        "message": "Login successful",
                        "user": {
                            "email": user[1],
                            "name": user[4] or email,
                            "language": user[3] or 'en',
                            "is_admin": is_admin
                        },
                        "is_admin": is_admin
                    })
                else:
                    return jsonify({"error": "Invalid email or password"}), 401
        except Exception as e:
            logger.error(f"Error in login: {e}")
            return jsonify({"error": "Login failed"}), 500
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')

    try:
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone_number')

        if not all([first_name, last_name, email, password]):
            return jsonify({"error": "All fields except phone are required"}), 400

        password_hash = generate_password_hash(password)

        with engine.begin() as conn:
            # ✅ Check for duplicate email
            existing = conn.execute(text("SELECT 1 FROM users WHERE email = :email"), {"email": email}).fetchone()
            if existing:
                return jsonify({"error": "Email already registered"}), 400

            conn.execute(text("""
                INSERT INTO users (first_name, last_name, email, password_hash, phone_number, created_at, is_active)
                VALUES (:first_name, :last_name, :email, :password_hash, :phone, NOW(), TRUE)
            """), {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "password_hash": password_hash,
                "phone": phone
            })

        return jsonify({"success": True, "message": "Account created successfully"})

    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({"error": "Server error during registration"}), 500


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/user')
def get_user():
    """Get current user info"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    return jsonify({
        "user_id": session['user_id'],
        "email": session['email'],
        "name": session.get('name', session['email']),
        "language": session.get('language', 'en'),
        "is_admin": is_admin_user()
    })


@app.route('/api/admin/metrics')
@admin_required
def admin_metrics():
    """High-level KPIs for the admin dashboard."""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    try:
        with engine.connect() as conn:
            counts_query = text("""
                SELECT
                    (SELECT COUNT(*) FROM users) AS total_users,
                    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_users,
                    (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '7 days') AS weekly_active,
                    (SELECT COUNT(*) FROM schedules) AS total_schedules,
                    (SELECT COUNT(*) FROM routes) AS total_routes,
                    (SELECT COUNT(*) FROM bookmarks) AS total_bookmarks
            """)
            counts = conn.execute(counts_query).mappings().first()
            
            recent_users_query = text("""
                SELECT 
                    user_id,
                    first_name,
                    last_name,
                    email,
                    is_active,
                    created_at,
                    last_login
                FROM users
                ORDER BY created_at DESC
                LIMIT 5
            """)
            recent_users = conn.execute(recent_users_query).mappings().all()
            
            top_routes_query = text("""
                SELECT 
                    r.route_id,
                    src.station_name AS source,
                    dst.station_name AS destination,
                    r.transport_type,
                    COUNT(DISTINCT s.schedule_id) AS schedule_count,
                    COALESCE(SUM(a.seats_available), 0) AS seats_available
                FROM routes r
                JOIN stations src ON r.source_station_id = src.station_id
                JOIN stations dst ON r.destination_station_id = dst.station_id
                LEFT JOIN schedules s ON s.route_id = r.route_id
                LEFT JOIN availability a ON a.schedule_id = s.schedule_id AND a.travel_date >= CURRENT_DATE
                GROUP BY r.route_id, src.station_name, dst.station_name, r.transport_type
                ORDER BY schedule_count DESC, seats_available DESC
                LIMIT 5
            """)
            top_routes = conn.execute(top_routes_query).mappings().all()
        
        response = {
            "counts": {
                "total_users": int(counts.get('total_users', 0)) if counts else 0,
                "active_users": int(counts.get('active_users', 0)) if counts else 0,
                "weekly_active": int(counts.get('weekly_active', 0)) if counts else 0,
                "total_schedules": int(counts.get('total_schedules', 0)) if counts else 0,
                "total_routes": int(counts.get('total_routes', 0)) if counts else 0,
                "total_bookmarks": int(counts.get('total_bookmarks', 0)) if counts else 0,
            },
            "recent_users": [
                {
                    "user_id": row["user_id"],
                    "name": f"{(row['first_name'] or '').strip()} {(row['last_name'] or '').strip()}".strip() or row["email"],
                    "email": row["email"],
                    "is_active": row["is_active"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                    "last_login": row["last_login"].isoformat() if row["last_login"] else None
                }
                for row in recent_users
            ],
            "top_routes": [
                {
                    "route_id": row["route_id"],
                    "source": row["source"],
                    "destination": row["destination"],
                    "transport_type": row["transport_type"],
                    "schedule_count": int(row["schedule_count"] or 0),
                    "seats_available": int(row["seats_available"] or 0)
                }
                for row in top_routes
            ]
        }
        return jsonify(response)
    except Exception as e:
        logger.error(f"Admin metrics error: {e}")
        return jsonify({"error": "Failed to load metrics"}), 500


@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_users():
    """Paginated list of users for the admin dashboard."""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    try:
        limit = request.args.get('limit', 50, type=int)
        limit = max(1, min(limit, 200))
        search = request.args.get('search', '').strip().lower()
        
        base_sql = """
            SELECT 
                user_id,
                first_name,
                last_name,
                email,
                phone_number,
                is_active,
                created_at,
                last_login
            FROM users
        """
        params = {"limit": limit}
        filters = []
        
        if search:
            filters.append("(LOWER(email) LIKE :search OR LOWER(first_name) LIKE :search OR LOWER(last_name) LIKE :search)")
            params["search"] = f"%{search}%"
        
        if filters:
            base_sql += " WHERE " + " AND ".join(filters)
        
        base_sql += " ORDER BY created_at DESC LIMIT :limit"
        
        with engine.connect() as conn:
            rows = conn.execute(text(base_sql), params).mappings().all()
        
        users = [{
            "user_id": row["user_id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "email": row["email"],
            "phone_number": row["phone_number"],
            "is_active": row["is_active"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "last_login": row["last_login"].isoformat() if row["last_login"] else None
        } for row in rows]
        
        return jsonify({"users": users})
    except Exception as e:
        logger.error(f"Admin user list error: {e}")
        return jsonify({"error": "Failed to load users"}), 500


@app.route('/api/admin/users/<int:user_id>/status', methods=['PATCH'])
@admin_required
def admin_toggle_user_status(user_id):
    """Enable or disable a user account."""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.get_json() or {}
    if "is_active" not in data:
        return jsonify({"error": "is_active flag required"}), 400
    
    new_status = bool(data["is_active"])
    
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                UPDATE users
                SET is_active = :status
                WHERE user_id = :user_id
            """), {"status": new_status, "user_id": user_id})
        
        if result.rowcount == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"success": True, "user_id": user_id, "is_active": new_status})
    except Exception as e:
        logger.error(f"Admin update user error: {e}")
        return jsonify({"error": "Failed to update user status"}), 500


def parse_time_string(value):
    """Parse a HH:MM or HH:MM:SS string into a time object."""
    if not value or not isinstance(value, str):
        return None
    value = value.strip()
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    return None


def parse_date_string(value):
    """Parse YYYY-MM-DD date strings."""
    if not value or not isinstance(value, str):
        return None
    value = value.strip()
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


@app.route('/api/admin/stations')
@admin_required
def admin_station_search():
    """Search stations for autocomplete (admin only)."""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    query_text = request.args.get('search', '').strip()
    limit = request.args.get('limit', 8, type=int)
    limit = max(1, min(limit, 25))
    
    if len(query_text) < 2:
        return jsonify({"stations": []})
    
    sql = text("""
        SELECT station_id, station_name
        FROM stations
        WHERE station_name ILIKE :search
        ORDER BY station_name ASC
        LIMIT :limit
    """)
    
    try:
        with engine.connect() as conn:
            rows = conn.execute(sql, {"search": f"%{query_text}%", "limit": limit}).fetchall()
        
        stations = [{
            "station_id": row[0],
            "station_name": row[1]
        } for row in rows]
        return jsonify({"stations": stations})
    except Exception as e:
        logger.error(f"Admin station search error: {e}")
        return jsonify({"error": "Failed to search stations"}), 500


@app.route('/api/admin/routes', methods=['POST'])
@admin_required
def admin_create_route():
    """Create a new route entry."""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.get_json() or {}
    route_code = (data.get('route_code') or '').strip().upper()
    if not route_code:
        return jsonify({"error": "route_code is required"}), 400

    try:
        source_id = int(data.get('source_station_id', 0))
        destination_id = int(data.get('destination_station_id', 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Station IDs must be integers"}), 400
    
    transport_type = (data.get('transport_type') or '').strip().lower()
    distance_km = data.get('distance_km')
    
    if source_id <= 0 or destination_id <= 0:
        return jsonify({"error": "Valid station IDs are required"}), 400
    if source_id == destination_id:
        return jsonify({"error": "Source and destination must be different"}), 400
    if transport_type not in {'bus', 'train'}:
        return jsonify({"error": "transport_type must be 'bus' or 'train'"}), 400
    try:
        distance_km = float(distance_km)
    except (TypeError, ValueError):
        return jsonify({"error": "distance_km must be numeric"}), 400
    if distance_km <= 0:
        return jsonify({"error": "distance_km must be positive"}), 400
    
    try:
        with engine.begin() as conn:
            station_exists = conn.execute(text("""
                SELECT station_id FROM stations WHERE station_id IN (:src, :dst)
            """), {"src": source_id, "dst": destination_id}).fetchall()
            if len(station_exists) != 2:
                return jsonify({"error": "One or both station IDs do not exist"}), 400
            
            duplicate = conn.execute(text("""
                SELECT route_id FROM routes 
                WHERE source_station_id = :src AND destination_station_id = :dst 
                AND transport_type = :transport_type
            """), {"src": source_id, "dst": destination_id, "transport_type": transport_type}).fetchone()
            if duplicate:
                return jsonify({"error": "Route already exists for this transport type"}), 400
            
            duplicate_code = conn.execute(text("""
                SELECT route_id FROM routes WHERE route_code = :code
            """), {"code": route_code}).fetchone()
            if duplicate_code:
                return jsonify({"error": "Route code already in use"}), 400
            
            result = conn.execute(text("""
                INSERT INTO routes (source_station_id, destination_station_id, transport_type, distance_km, route_code)
                VALUES (:src, :dst, :transport_type, :distance, :code)
                RETURNING route_id
            """), {
                "src": source_id,
                "dst": destination_id,
                "transport_type": transport_type,
                "distance": distance_km,
                "code": route_code
            }).fetchone()
        
        return jsonify({"success": True, "route_id": result[0]})
    except Exception as e:
        logger.error(f"Admin create route error: {e}")
        return jsonify({"error": "Failed to create route"}), 500


@app.route('/api/admin/routes/search')
@admin_required
def admin_route_search():
    """Search routes for schedule creation."""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    query_text = request.args.get('search', '').strip()
    limit = request.args.get('limit', 10, type=int)
    limit = max(1, min(limit, 25))
    
    if len(query_text) < 2:
        return jsonify({"routes": []})
    
    sql = text("""
        SELECT 
            r.route_id,
            r.route_code,
            r.transport_type,
            r.distance_km,
            src.station_name AS source_name,
            dst.station_name AS destination_name
        FROM routes r
        JOIN stations src ON r.source_station_id = src.station_id
        JOIN stations dst ON r.destination_station_id = dst.station_id
        WHERE src.station_name ILIKE :term
           OR dst.station_name ILIKE :term
           OR r.route_code ILIKE :term
        ORDER BY r.route_code NULLS LAST, r.route_id
        LIMIT :limit
    """)
    
    try:
        with engine.connect() as conn:
            rows = conn.execute(sql, {"term": f"%{query_text}%", "limit": limit}).fetchall()
        
        routes = [{
            "route_id": row[0],
            "route_code": row[1],
            "transport_type": row[2],
            "distance_km": float(row[3]) if row[3] is not None else None,
            "source": row[4],
            "destination": row[5]
        } for row in rows]
        return jsonify({"routes": routes})
    except Exception as e:
        logger.error(f"Admin route search error: {e}")
        return jsonify({"error": "Failed to search routes"}), 500


@app.route('/api/admin/schedules', methods=['POST'])
@admin_required
def admin_create_schedule():
    """Create a new schedule for a route."""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.get_json() or {}
    
    try:
        route_id = int(data.get('route_id', 0))
    except (TypeError, ValueError):
        return jsonify({"error": "route_id must be an integer"}), 400
    
    operator = (data.get('operator') or '').strip()
    departure_time_str = data.get('departure_time')
    arrival_time_str = data.get('arrival_time')
    days_of_week = (data.get('days_of_week') or 'Daily').strip()
    
    if route_id <= 0:
        return jsonify({"error": "Valid route_id required"}), 400
    if not operator:
        return jsonify({"error": "operator is required"}), 400
    
    departure_time = parse_time_string(departure_time_str)
    arrival_time = parse_time_string(arrival_time_str)
    if not departure_time or not arrival_time:
        return jsonify({"error": "departure_time and arrival_time must be HH:MM format"}), 400
    
    availability_date = parse_date_string(data.get('availability_date'))
    seats_total = data.get('seats_total')
    seats_booked = data.get('seats_booked')
    
    if seats_total is not None:
        try:
            seats_total = int(seats_total)
        except (TypeError, ValueError):
            return jsonify({"error": "seats_total must be an integer"}), 400
    else:
        seats_total = 40
    
    if seats_booked is not None:
        try:
            seats_booked = int(seats_booked)
        except (TypeError, ValueError):
            return jsonify({"error": "seats_booked must be an integer"}), 400
    else:
        seats_booked = 0
    
    if seats_total < 0 or seats_booked < 0:
        return jsonify({"error": "Seat counts must be non-negative"}), 400
    if seats_booked > seats_total:
        return jsonify({"error": "seats_booked cannot exceed seats_total"}), 400
    
    try:
        with engine.begin() as conn:
            route_exists = conn.execute(text("""
                SELECT route_id FROM routes WHERE route_id = :route_id
            """), {"route_id": route_id}).fetchone()
            if not route_exists:
                return jsonify({"error": "Route not found"}), 404
            
            result = conn.execute(text("""
                INSERT INTO schedules (route_id, operator, departure_time, arrival_time, days_of_week)
                VALUES (:route_id, :operator, :departure_time, :arrival_time, :days_of_week)
                RETURNING schedule_id
            """), {
                "route_id": route_id,
                "operator": operator,
                "departure_time": departure_time,
                "arrival_time": arrival_time,
                "days_of_week": days_of_week or 'Daily'
            }).fetchone()
            
            availability_id = None
            if availability_date:
                availability_result = conn.execute(text("""
                    INSERT INTO availability (schedule_id, travel_date, seats_total, seats_booked)
                    VALUES (:schedule_id, :travel_date, :seats_total, :seats_booked)
                    RETURNING availability_id
                """), {
                    "schedule_id": result[0],
                    "travel_date": availability_date,
                    "seats_total": seats_total,
                    "seats_booked": seats_booked
                }).fetchone()
                availability_id = availability_result[0]
        
        return jsonify({"success": True, "schedule_id": result[0], "availability_id": availability_id})
    except Exception as e:
        logger.error(f"Admin create schedule error: {e}")
        return jsonify({"error": "Failed to create schedule"}), 500


@app.route('/')
def home():
    # Check if user is logged in
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    try:
        return render_template('index.html', is_admin=is_admin_user(), user_name=session.get('name', session.get('email')))
    except Exception:
        return "Voice-Based Transport Enquiry System Running! (No template found)", 200

@app.route('/admin')
@admin_required
def admin_dashboard():
    return render_template('admin.html', user_name=session.get('name', session.get('email')))


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    if engine is None:
        return jsonify({"status": "error", "message": "Database not connected"}), 500
    return jsonify({"status": "ok", "message": "System is running", "authenticated": 'user_id' in session})

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
            SELECT s.schedule_id, s.operator, s.departure_time, s.arrival_time, r.distance_km
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
                estimated_fare = float(result[4]) * 2 if result[4] else 0
                return jsonify({
                    "schedule_id": result[0],  # ✅ added
                    "operator": result[1],
                    "departure_time": str(result[2]),
                    "arrival_time": str(result[3]),
                    "fare": estimated_fare,
                    "transport_type": "bus",
                    "distance_km": float(result[4]) if result[4] else 0
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
            SELECT s.schedule_id, s.operator, s.departure_time, s.arrival_time, r.distance_km
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
                estimated_fare = float(result[4]) * 3 if result[4] else 0
                return jsonify({
                    "schedule_id": result[0],  # ✅ added
                    "operator": result[1],
                    "departure_time": str(result[2]),
                    "arrival_time": str(result[3]),
                    "fare": estimated_fare,
                    "transport_type": "train",
                    "distance_km": float(result[4]) if result[4] else 0
                })
            else:
                return jsonify({"message": "No train found for this route"})
    except Exception as e:
        logger.error(f"Error in next_train: {e}")
        return jsonify({"error": "Database query failed"}), 500

def extract_date_from_text(text):
    """Extract date from text like 'delhi on 17th november' or 'दिल्ली 17 नवंबर को' and return (cleaned_text, date_string)"""
    if not text:
        return text, None
    
    # Hindi month names
    hindi_months = {
        'जनवरी': 0, 'फरवरी': 1, 'मार्च': 2, 'अप्रैल': 3, 'मई': 4, 'जून': 5,
        'जुलाई': 6, 'अगस्त': 7, 'सितंबर': 8, 'अक्टूबर': 9, 'नवंबर': 10, 'दिसंबर': 11
    }
    english_months = ["january", "february", "march", "april", "may", "june",
                     "july", "august", "september", "october", "november", "december"]
    
    # Pattern to match English: "on 17th november", "on 17 november", "on 1st january", etc.
    # Handle ordinals: st, nd, rd, th
    date_pattern = r'\s+on\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)'
    match = re.search(date_pattern, text.lower())
    month_index = -1
    
    if match:
        day = int(match.group(1))
        month_name = match.group(2).lower()
        try:
            month_index = english_months.index(month_name)
        except ValueError:
            pass
    else:
        # Pattern to match Hindi: "17 नवंबर को", "15 जनवरी", etc.
        hindi_date_pattern = r'(\d{1,2})(?:\s+तारीख|\s+को)?\s+([\u0900-\u097F]+)'
        match = re.search(hindi_date_pattern, text)
        if match:
            day = int(match.group(1))
            month_name = match.group(2).strip()
            month_index = hindi_months.get(month_name, -1)
            if month_index >= 0:
                date_pattern = hindi_date_pattern
    
    if match and month_index >= 0:
        try:
            year = datetime.now().year
            date_obj = datetime(year, month_index + 1, day)
            date_string = date_obj.strftime('%Y-%m-%d')
            
            # Remove the date part from the text
            cleaned_text = re.sub(date_pattern, '', text, flags=re.IGNORECASE).strip()
            return cleaned_text, date_string
        except (ValueError, IndexError):
            pass
    
    return text, None

@app.route('/api/search')
def search_transport():
    """Search transport (bus/train) from source to destination with dynamic fare logic"""
    if not engine:
        return jsonify({"error": "Database not connected"}), 500

    source = request.args.get('source', '').strip()
    destination = request.args.get('destination', '').strip()
    transport_type = request.args.get('type', '').strip().lower()
    travel_date = request.args.get('date', '').strip()

    # Extract date from destination if date field is empty but destination contains date info
    if not travel_date and destination:
        cleaned_destination, extracted_date = extract_date_from_text(destination)
        if extracted_date:
            destination = cleaned_destination
            travel_date = extracted_date
            logger.info(f"Extracted date '{extracted_date}' from destination, cleaned to '{destination}'")

    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400

    try:
        # Build SQL filters
        filters = ["src.station_name ILIKE :src", "dst.station_name ILIKE :dst"]
        params = {"src": f"%{source}%", "dst": f"%{destination}%"}

        if transport_type in ['bus', 'train']:
            filters.append("r.transport_type = :t")
            params["t"] = transport_type

        # Build LEFT JOIN condition - include date filter in JOIN if date is provided
        # This way schedules are still shown even if no availability exists for that date
        availability_join = "LEFT JOIN availability a ON a.schedule_id = s.schedule_id"
        if travel_date:
            availability_join += " AND a.travel_date = :d"
            params["d"] = travel_date
            # When date is specified, use DISTINCT ON to get one record per schedule
            distinct_clause = "DISTINCT ON (s.schedule_id)"
            order_clause = "ORDER BY s.schedule_id, a.travel_date DESC NULLS LAST"
            # No additional date filter needed when specific date is requested
            date_filter = ""
            # Use COALESCE to show requested date even if no availability record
            travel_date_select = f"COALESCE(a.travel_date, '{travel_date}') AS travel_date"
        else:
            # When no date is specified, filter to show only today and future dates
            # Filter in JOIN to get all matching availability records
            availability_join += " AND (a.travel_date >= CURRENT_DATE OR a.travel_date IS NULL)"
            distinct_clause = ""
            order_clause = "ORDER BY s.schedule_id, a.travel_date ASC NULLS LAST"
            date_filter = ""
            # Don't use COALESCE - keep NULL as NULL so we can handle it separately
            travel_date_select = "a.travel_date AS travel_date"

        # ✅ SQL - When date specified: one record per schedule. When not: all availability records (today and future)
        sql = f"""
        SELECT {distinct_clause}
            s.schedule_id, 
            s.operator, 
            s.departure_time, 
            s.arrival_time,
            r.distance_km, 
            r.transport_type,
            {travel_date_select},
            a.seats_total, 
            a.seats_booked, 
            a.seats_available
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN stations src ON r.source_station_id = src.station_id
        JOIN stations dst ON r.destination_station_id = dst.station_id
        {availability_join}
        WHERE {" AND ".join(filters)}
        {date_filter}
        {order_clause};
        """
        
        # Add travel_date to params for COALESCE if provided
        if travel_date:
            params["travel_date"] = travel_date

        logger.info(f"Search query - source: {source}, destination: {destination}, type: {transport_type}, date: {travel_date}")
        logger.info(f"SQL: {sql}")
        logger.info(f"Params: {params}")

        with engine.connect() as conn:
            results = conn.execute(text(sql), params).fetchall()

        logger.info(f"Found {len(results)} raw results from database")
        
        # Log sample of results to debug
        if results and not travel_date:
            logger.info(f"Sample result: schedule_id={results[0][0]}, date={results[0][6]}, total_rows={len(results)}")

        if not results:
            return jsonify({"message": "No transport found for given filters"})

        # === FARE LOGIC ===
        BASE_RATE = {
            'AC': 3.5,
            'NON-AC': 2.5,
            'SLEEPER': 4.0,
            'VOLVO': 4.8,
            'ORDINARY': 2.0
        }

        OPERATOR_MULTIPLIER = {
            'UPSRTC': 1.10,
            'MSRTC': 0.95,
            'RSRTC': 1.00,
            'KSRTC': 1.05,
            'TSRTC': 1.08
        }

        # ✅ Process results - different logic for date-specified vs no-date
        transport_list = []
        
        if travel_date:
            # When date is specified: one result per schedule (already deduplicated by DISTINCT ON)
            seen_schedule_ids = set()
            
            for row in results:
                schedule_id = row[0]
                
                # Skip if we've already processed this schedule_id
                if schedule_id in seen_schedule_ids:
                    continue
                
                seen_schedule_ids.add(schedule_id)
                
                operator = row[1] or ''
                departure_time = str(row[2])
                arrival_time = str(row[3])
                distance_km = float(row[4]) if row[4] else 0
                ttype = row[5].lower()
                travel_date_val = travel_date  # Use requested date
                seats_total = row[7] or 40
                seats_booked = row[8] or 0
                seats_available = row[9] or (seats_total - seats_booked)

                # ---- Infer bus type from operator ----
                op_upper = operator.upper()
                if 'VOLVO' in op_upper:
                    bus_type = 'VOLVO'
                elif 'SLEEP' in op_upper:
                    bus_type = 'SLEEPER'
                elif 'AC' in op_upper:
                    bus_type = 'AC'
                else:
                    bus_type = 'ORDINARY'

                # ---- Dynamic Fare Calculation ----
                base_rate = BASE_RATE.get(bus_type, BASE_RATE['ORDINARY'])
                operator_multiplier = OPERATOR_MULTIPLIER.get(op_upper, 1.0)

                seat_ratio = seats_available / seats_total if seats_total > 0 else 1
                seat_factor = 1 + (0.5 * (1 - seat_ratio))  # up to +50% when seats are low

                dep_hour = int(departure_time.split(':')[0]) if ':' in departure_time else 12
                peak_factor = 1.15 if (6 <= dep_hour <= 9 or 17 <= dep_hour <= 21) else 1.0

                # Total fare
                fare = distance_km * base_rate * operator_multiplier * seat_factor * peak_factor
                fare = max(150, round(fare, 2))  # minimum ₹150

                transport_list.append({
                    "schedule_id": schedule_id,
                    "operator": operator,
                    "departure_time": departure_time,
                    "arrival_time": arrival_time,
                    "distance_km": distance_km,
                    "fare": fare,
                    "transport_type": ttype,
                    "bus_type": bus_type,
                    "travel_date": travel_date_val,
                    "seats_total": seats_total,
                    "seats_booked": seats_booked,
                    "seats_available": seats_available
                })
        else:
            # When no date is specified: group by schedule_id and collect all available dates (today and future)
            schedule_dict = {}
            today = datetime.now().date()
            
            for row in results:
                schedule_id = row[0]
                
                if schedule_id not in schedule_dict:
                    schedule_dict[schedule_id] = {
                        'schedule_id': schedule_id,
                        'operator': row[1] or '',
                        'departure_time': str(row[2]),
                        'arrival_time': str(row[3]),
                        'distance_km': float(row[4]) if row[4] else 0,
                        'transport_type': row[5].lower(),
                        'available_dates': []
                    }
                
                # Add this date to available dates if it exists and is today or future
                travel_date_val = row[6]  # This can be None/NULL
                if travel_date_val is not None:
                    date_str = str(travel_date_val)
                    try:
                        # Parse the date and check if it's today or future
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                        if date_obj >= today:
                            seats_total = row[7] or 40
                            seats_booked = row[8] or 0
                            seats_available = row[9] or (seats_total - seats_booked)
                            
                            # Check if this date is already in the list (deduplicate)
                            date_exists = any(d['date'] == date_str for d in schedule_dict[schedule_id]['available_dates'])
                            if not date_exists:
                                schedule_dict[schedule_id]['available_dates'].append({
                                    'date': date_str,
                                    'seats_total': seats_total,
                                    'seats_booked': seats_booked,
                                    'seats_available': seats_available
                                })
                    except (ValueError, TypeError):
                        # Skip invalid dates
                        pass
                # If travel_date is NULL and schedule has no dates yet, add today's date as default
                elif not schedule_dict[schedule_id]['available_dates']:
                    today_str = today.isoformat()
                    schedule_dict[schedule_id]['available_dates'].append({
                        'date': today_str,
                        'seats_total': 40,
                        'seats_booked': 0,
                        'seats_available': 40
                    })
            
            # Process each schedule and create transport list entries
            logger.info(f"Processing {len(schedule_dict)} schedules with availability data")
            for schedule_id, schedule_data in schedule_dict.items():
                # Sort available_dates by date (today first, then ascending)
                if schedule_data['available_dates']:
                    # Sort by date string (YYYY-MM-DD format sorts correctly)
                    schedule_data['available_dates'].sort(key=lambda x: x['date'])
                    logger.info(f"Schedule {schedule_id} has {len(schedule_data['available_dates'])} available dates: {[d['date'] for d in schedule_data['available_dates']]}")
                    first_date = schedule_data['available_dates'][0]
                    travel_date_val = first_date['date']
                    seats_total = first_date['seats_total']
                    seats_booked = first_date['seats_booked']
                    seats_available = first_date['seats_available']
                else:
                    travel_date_val = datetime.now().date().isoformat()
                    seats_total = 40
                    seats_booked = 0
                    seats_available = 40
                
                operator = schedule_data['operator']
                departure_time = schedule_data['departure_time']
                arrival_time = schedule_data['arrival_time']
                distance_km = schedule_data['distance_km']
                ttype = schedule_data['transport_type']
                
                # ---- Infer bus type from operator ----
                op_upper = operator.upper()
                if 'VOLVO' in op_upper:
                    bus_type = 'VOLVO'
                elif 'SLEEP' in op_upper:
                    bus_type = 'SLEEPER'
                elif 'AC' in op_upper:
                    bus_type = 'AC'
                else:
                    bus_type = 'ORDINARY'

                # ---- Dynamic Fare Calculation ----
                base_rate = BASE_RATE.get(bus_type, BASE_RATE['ORDINARY'])
                operator_multiplier = OPERATOR_MULTIPLIER.get(op_upper, 1.0)

                seat_ratio = seats_available / seats_total if seats_total > 0 else 1
                seat_factor = 1 + (0.5 * (1 - seat_ratio))  # up to +50% when seats are low

                dep_hour = int(departure_time.split(':')[0]) if ':' in departure_time else 12
                peak_factor = 1.15 if (6 <= dep_hour <= 9 or 17 <= dep_hour <= 21) else 1.0

                # Total fare
                fare = distance_km * base_rate * operator_multiplier * seat_factor * peak_factor
                fare = max(150, round(fare, 2))  # minimum ₹150

                transport_list.append({
                    "schedule_id": schedule_id,
                    "operator": operator,
                    "departure_time": departure_time,
                    "arrival_time": arrival_time,
                    "distance_km": distance_km,
                    "fare": fare,
                    "transport_type": ttype,
                    "bus_type": bus_type,
                    "travel_date": travel_date_val,
                    "seats_total": seats_total,
                    "seats_booked": seats_booked,
                    "seats_available": seats_available,
                    "available_dates": schedule_data['available_dates']  # Include all dates
                })

        # ✅ Sort by departure_time
        transport_list.sort(key=lambda x: x['departure_time'])

        return jsonify({"results": transport_list})

    except Exception as e:
        logger.error(f"Error in search_transport: {e}")
        return jsonify({"error": "Database query failed"}), 500


@app.route('/api/bookmark', methods=['POST'])
def add_bookmark():
    """Add a schedule to bookmarks with stored fare."""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json()
    schedule_id = data.get('schedule_id')
    fare = data.get('fare', 0)

    if not schedule_id:
        return jsonify({"error": "schedule_id required"}), 400

    try:
        with engine.begin() as conn:  # ✅ begin() auto commits/rolls back
            conn.execute(text("""
                INSERT INTO bookmarks (user_id, schedule_id, fare, saved_on)
                VALUES (:user_id, :schedule_id, :fare, NOW())
                ON CONFLICT (user_id, schedule_id)
                DO UPDATE SET fare = EXCLUDED.fare, saved_on = NOW()
            """), {
                "user_id": session['user_id'],
                "schedule_id": schedule_id,
                "fare": fare
            })

        return jsonify({
            "success": True,
            "message": "Added to bookmarks with fare",
            "fare": fare
        })

    except Exception as e:
        logger.error(f"Bookmark error: {e}")
        return jsonify({"error": "Could not add bookmark"}), 500


@app.route('/api/bookmarks')
def get_bookmarks():
    """Return all bookmarked schedules with stored fare."""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    b.bookmark_id,
                    s.schedule_id,
                    s.operator,
                    s.departure_time, 
                    s.arrival_time, 
                    r.transport_type, 
                    r.distance_km,
                    COALESCE(b.fare, 0) AS fare,
                    src.station_name AS source, 
                    dst.station_name AS destination,
                    b.saved_on
                FROM bookmarks b
                JOIN schedules s ON b.schedule_id = s.schedule_id
                JOIN routes r ON s.route_id = r.route_id
                JOIN stations src ON r.source_station_id = src.station_id
                JOIN stations dst ON r.destination_station_id = dst.station_id
                WHERE b.user_id = :user_id
                ORDER BY b.saved_on DESC
            """), {"user_id": session['user_id']}).fetchall()

            data = [{
                "bookmark_id": row[0],
                "schedule_id": row[1],
                "operator": row[2],
                "departure_time": str(row[3]),
                "arrival_time": str(row[4]),
                "transport_type": row[5],
                "distance_km": float(row[6]),
                "fare": float(row[7]),
                "source": row[8],
                "destination": row[9],
                "saved_on": str(row[10])
            } for row in result]

        return jsonify({"bookmarks": data})

    except Exception as e:
        logger.error(f"Fetch bookmarks error: {e}")
        return jsonify({"error": "Failed to load bookmarks"}), 500

@app.route('/api/bookmark/<int:schedule_id>', methods=['DELETE'])
def remove_bookmark(schedule_id):
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        with engine.connect() as conn:
            conn.execute(text("""
                DELETE FROM bookmarks 
                WHERE user_id = :user_id AND schedule_id = :schedule_id
            """), {"user_id": session['user_id'], "schedule_id": schedule_id})
            conn.commit()
        return jsonify({"success": True, "message": "Removed from bookmarks"})
    except Exception as e:
        logger.error(f"Remove bookmark error: {e}")
        return jsonify({"error": "Failed to remove bookmark"}), 500

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
            SELECT s.schedule_id, r.distance_km, r.transport_type, s.operator
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
                    fare_rate = 3 if result[2] == 'train' else 2
                    estimated_fare = float(result[1]) * fare_rate if result[1] else 0
                    fare_info.append({
                        "schedule_id": result[0],  # ✅ added
                        "fare": estimated_fare,
                        "transport_type": result[2],
                        "operator": result[3],
                        "distance_km": float(result[1]) if result[1] else 0
                    })
                return jsonify({"fares": fare_info})
            else:
                return jsonify({"message": "No fare information found for this route"})
    except Exception as e:
        logger.error(f"Error in get_fare: {e}")
        return jsonify({"error": "Database query failed"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
