from flask import Flask, request, jsonify
from db import get_db_connection

app = Flask(__name__)

@app.route('/')
def home():
    return "Backend is running!"

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data['name']
    email = data['email']
    password = data['password']

    conn = get_db_connection()
    cursor = conn.cursor()
    query = "INSERT INTO Users (name, email, password, role) VALUES (%s, %s, %s, 'user')"
    cursor.execute(query, (name, email, password))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "User registered successfully"})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    password = data['password']

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM Users WHERE email=%s AND password=%s"
    cursor.execute(query, (email, password))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        return jsonify({"message": "Login successful", "user_id": user['user_id'], "role": user['role'], "name": user['name']})
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route('/submit_request', methods=['POST'])
def submit_request():
    data = request.json
    user_id = data['user_id']
    file_name = data['file_name']
    copies = data['copies']
    color = data['color']
    pages = data.get('pages', 'ALL')

    conn = get_db_connection()
    cursor = conn.cursor()

    doc_query = "INSERT INTO Documents (user_id, file_name) VALUES (%s, %s)"
    cursor.execute(doc_query, (user_id, file_name))
    doc_id = cursor.lastrowid

    req_query = "INSERT INTO PrintRequests (doc_id, copies, color, pages, status) VALUES (%s, %s, %s, %s, 'Pending')"
    cursor.execute(req_query, (doc_id, copies, color, pages))

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Print request submitted successfully"})

@app.route('/user_requests/<int:user_id>', methods=['GET'])
def user_requests(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT pr.req_id, d.file_name, pr.copies, pr.color,
               pr.pages, pr.status, pr.request_date
        FROM PrintRequests pr
        JOIN Documents d ON pr.doc_id = d.doc_id
        WHERE d.user_id = %s
    """
    cursor.execute(query, (user_id,))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)

@app.route('/all_requests', methods=['GET'])
def all_requests():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT pr.req_id, u.name, d.file_name, pr.copies,
               pr.color, pr.pages, pr.status, pr.request_date
        FROM PrintRequests pr
        JOIN Documents d ON pr.doc_id = d.doc_id
        JOIN Users u ON d.user_id = u.user_id
        ORDER BY pr.request_date DESC
    """
    cursor.execute(query)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)

@app.route('/update_status', methods=['POST'])
def update_status():
    data = request.json
    req_id = data['req_id']
    status = data['status']

    conn = get_db_connection()
    cursor = conn.cursor()
    query = "UPDATE PrintRequests SET status=%s WHERE req_id=%s"
    cursor.execute(query, (status, req_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Status updated successfully"})

if __name__ == '__main__':
    app.run(debug=True)