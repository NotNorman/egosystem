import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
import psycopg2

load_dotenv()
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')

app = Flask(__name__)

# Database connection details
DB_CONFIG = {
    "dbname": DB_NAME,
    "user": DB_USER,
    "password": DB_PASS,
    "host": DB_HOST,
    "port": DB_PORT
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# ==========================================
# Task 1: Admin
# ==========================================
# 1.1. Check if username exists
@app.route('/api/admin/check_username', methods=['POST'])
def check_username():
    username = request.json.get('username', '')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM user_data WHERE LOWER(username) = LOWER(%s);", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"exists": user is not None})

# 1.2. Verify an existing user's password
@app.route('/api/admin/verify_password', methods=['POST'])
def verify_password():
    username = request.json.get('username', '')
    password = request.json.get('password')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM user_data WHERE LOWER(username) = LOWER(%s) AND password = %s;", (username, password))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"valid": user is not None})

# 1.3. Check if an NFC card is already registered
@app.route('/api/admin/check_card', methods=['POST'])
def check_card():
    nfc_uid = request.json.get('nfc_uid')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT nfc_uid FROM card_data WHERE nfc_uid = %s;", (nfc_uid,))
    card = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"exists": card is not None})

# 1.4. Finalize: Register new user (if needed) and attach the card
@app.route('/api/admin/register_card', methods=['POST'])
def register_card():
    data = request.json
    username = data.get('username', '')
    password = data.get('password')
    nfc_uid = data.get('nfc_uid')
    is_new_user = data.get('is_new_user')

    if not username:
        return jsonify({"status": "error", "message": "Username cannot be empty"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        if is_new_user:
            # Insert new user and get their generated ID
            cur.execute(
                "INSERT INTO user_data (username, password) VALUES (%s, %s) RETURNING id;",
                (username, password)
            )
            user_id = cur.fetchone()[0]
        else:
            # Get existing user's ID
            cur.execute("SELECT id FROM user_data WHERE LOWER(username) = LOWER(%s);", (username,))
            user_id = cur.fetchone()[0]

        # Insert the new card linked to the user
        cur.execute(
            "INSERT INTO card_data (nfc_uid, user_id) VALUES (%s, %s);",
            (nfc_uid, user_id)
        )
        conn.commit()
        status = "success"
    except Exception as e:
        conn.rollback()
        status = "error"
        print(e)
    finally:
        cur.close()
        conn.close()

    return jsonify({"status": status})


# ==========================================
# Task 2: Authenticate
# ==========================================
# 2.1. Authenticate user when they tap their card (UPDATED for mid-workout)
@app.route('/api/auth/card_tap', methods=['POST'])
def auth_card_tap():
    data = request.json
    nfc_uid = data.get('nfc_uid', '').strip().upper()
    exercise_id = data.get('exercise_id')
    device_id = data.get('device_id', 'Unknown Device')

    if not nfc_uid:
        return jsonify({"status": "error", "reason": "invalid", "message": "No UID provided"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Check card status and join with user data
    query = """
        SELECT c.is_active, u.username
        FROM card_data c
        JOIN user_data u ON c.user_id = u.id
        WHERE c.nfc_uid = %s;
    """
    cur.execute(query, (nfc_uid,))
    result = cur.fetchone()

    # 2. Determine access status and build the response payload
    access_granted = False
    response_payload = {}

    if result is None:
        response_payload = {
            "status": "error",
            "reason": "card_not_registered",
            "message": "Card is not registered."
        }
    else:
        is_active, username = result
        if not is_active:
            response_payload = {
                "status": "error",
                "reason": "card_is_inactive",
                "message": "Card has been deactivated."
            }
        else:
            access_granted = True
            response_payload = {
                "status": "success",
                "reason": "active",
                "username": username,
                "message": f"Welcome back, {username}!"
            }

    # ==========================================
    # UPDATED: Only log the reason if access was denied
    # ==========================================
    denied_reason = response_payload["reason"] if not access_granted else None

    cur.execute("""
        INSERT INTO tap_logs (nfc_uid, device_id, access_granted, denied_reason)
        VALUES (%s, %s, %s, %s);
    """, (nfc_uid, device_id, access_granted, denied_reason))

    # 4. Mid-workout login logic (only if access was granted)
    if access_granted and exercise_id:
        cur.execute("""
            UPDATE exercise_data
            SET nfc_uid = %s
            WHERE exercise_id = %s;
        """, (nfc_uid, exercise_id))

    # 5. Commit all changes to the database and close
    conn.commit()
    cur.close()
    conn.close()

    # 6. Return the stored response
    return jsonify(response_payload)

# ==========================================
# Task 3: Rowing Telemetry
# ==========================================
# 3.1. Initialize a new workout and return the ID
@app.route('/api/row/start_workout', methods=['POST'])
def start_workout():
    data = request.json
    nfc_uid = data.get('nfc_uid', "").strip()
    
    # If the string is empty, the user is a guest. Set it to a true SQL NULL.
    if not nfc_uid:
        nfc_uid = None

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert the workout and instantly ask PostgreSQL for the generated exercise_id
    cursor.execute("""
        INSERT INTO exercise_data (nfc_uid) 
        VALUES (%s) 
        RETURNING exercise_id;
    """, (nfc_uid,))
    
    new_exercise_id = cursor.fetchone()[0]
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"exercise_id": new_exercise_id, "status": "started"}), 200


# 3.2. Receive data pings during workout
@app.route('/api/row/telemetry', methods=['POST'])
def receive_telemetry():
    data = request.json

    # Ensure guest telemetries get a true NULL rather than an empty string
    nfc_uid = data.get('nfc_uid', "").strip()
    if not nfc_uid:
        nfc_uid = None

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO rowing_data
        (exercise_id, avg_speed, avg_rpm, distance, revs,
         humidity, temperature, resistance, total_time, active_time, 
         active_status, stroke_count, max_speed, min_speed)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data['exercise_id'], data['avg_speed'], data['avg_rpm'],
        data['distance'], data['revs'], data['humidity'], data['temperature'],
        data['resistance'], data['total_time'], data['active_time'], 
        data['active_status'], data.get('stroke_count', 0),
        data.get('max_speed', 0.0), data.get('min_speed', 0.0)
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"status": "saved"}), 200
# ==========================================
# Task 4: Rowing Machine Initialization
# ==========================================
@app.route('/api/row/init', methods=['GET'])
def get_machine_init():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Get the latest resistance level (Default to 4 if database is empty)
    cursor.execute("SELECT resistance FROM rowing_data ORDER BY id DESC LIMIT 1;")
    res_row = cursor.fetchone()
    latest_resistance = res_row[0] if res_row else 4
    
    # 2. Calculate true lifetime odometer (Sum of the max distance from every workout)
    cursor.execute("""
        SELECT COALESCE(SUM(session_max), 0) 
        FROM (
            SELECT MAX(distance) as session_max 
            FROM rowing_data 
            GROUP BY exercise_id
        ) sub;
    """)
    total_distance = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "latest_resistance": latest_resistance,
        "total_distance": float(total_distance)
    }), 200

@app.route('/api/row/debug', methods=['POST'])
def row_debug():
    data = request.json
    print("\n" + "="*40)
    print("🚨 HARDWARE ALERT:", data.get('error_log', 'Unknown Error'))
    print("="*40 + "\n")
    return jsonify({"status": "logged"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
