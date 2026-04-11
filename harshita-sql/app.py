import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from db import get_db_connection
from reportlab.pdfgen import canvas
import io

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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
    try:
        query = "INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, 'user')"
        cursor.execute(query, (name, email, password))
        conn.commit()
        return jsonify({"message": "User registered successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM Users WHERE email=? AND password=?"
    cursor.execute(query, (email, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"message": "Login successful", "user_id": user['user_id'], "role": user['role'], "name": user['name'], "balance": user['balance']})
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route('/submit_request', methods=['POST'])
def submit_request():
    user_id = request.form.get('user_id')
    copies = int(request.form.get('copies', 1))
    color = request.form.get('color', 'BW')
    pages = request.form.get('pages', 'All')
    
    file = request.files.get('file')
    if not file or file.filename == '':
        return jsonify({"message": "No file uploaded"}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    price_per_page = 10.0 if color == 'Color' else 2.0
    cost = copies * price_per_page

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT balance FROM Users WHERE user_id=?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    balance = user['balance']
    if balance < cost:
        return jsonify({"message": f"Insufficient balance. Cost is ₹{cost}"}), 400

    new_balance = balance - cost
    cursor.execute("UPDATE Users SET balance=? WHERE user_id=?", (new_balance, user_id))

    doc_query = "INSERT INTO Documents (user_id, file_name, file_path) VALUES (?, ?, ?)"
    cursor.execute(doc_query, (user_id, filename, file_path))
    doc_id = cursor.lastrowid

    req_query = "INSERT INTO PrintRequests (doc_id, copies, color, pages, cost, status) VALUES (?, ?, ?, ?, ?, 'Pending')"
    cursor.execute(req_query, (doc_id, copies, color, pages, cost))

    conn.commit()
    conn.close()
    
    return jsonify({"message": "Print request submitted successfully", "cost": cost, "new_balance": new_balance})

@app.route('/user_requests/<int:user_id>', methods=['GET'])
def user_requests(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT pr.req_id, d.file_name, pr.copies, pr.color,
               pr.pages, pr.cost, pr.status, pr.request_date
        FROM PrintRequests pr
        JOIN Documents d ON pr.doc_id = d.doc_id
        WHERE d.user_id = ?
        ORDER BY pr.request_date DESC
    """
    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()
    
    cursor.execute("SELECT balance FROM Users WHERE user_id=?", (user_id,))
    user_data = cursor.fetchone()
    conn.close()
    
    data = [dict(row) for row in rows]
    balance = user_data['balance'] if user_data else 0.0
    return jsonify({"requests": data, "balance": balance})

@app.route('/all_requests', methods=['GET'])
def all_requests():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT pr.req_id, u.name as userName, d.file_name, pr.copies,
               pr.color, pr.pages, pr.cost, pr.status, pr.request_date
        FROM PrintRequests pr
        JOIN Documents d ON pr.doc_id = d.doc_id
        JOIN Users u ON d.user_id = u.user_id
        ORDER BY pr.request_date DESC
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    data = [dict(row) for row in rows]
    return jsonify(data)

@app.route('/update_status', methods=['POST'])
def update_status():
    data = request.json
    req_id = data['req_id']
    status = data['status']

    conn = get_db_connection()
    cursor = conn.cursor()
    query = "UPDATE PrintRequests SET status=? WHERE req_id=?"
    cursor.execute(query, (status, req_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated successfully"})

@app.route('/topup', methods=['POST'])
def topup():
    data = request.json
    user_id = data['user_id']
    amount = float(data['amount'])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT balance FROM Users WHERE user_id=?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    new_balance = user['balance'] + amount
    cursor.execute("UPDATE Users SET balance=? WHERE user_id=?", (new_balance, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Topped up successfully by ₹{amount}", "new_balance": new_balance})

@app.route('/update_profile', methods=['POST'])
def update_profile():
    data = request.json
    user_id = data['user_id']
    name = data.get('name')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor()
    if password:
        cursor.execute("UPDATE Users SET name=?, password=? WHERE user_id=?", (name, password, user_id))
    else:
        cursor.execute("UPDATE Users SET name=? WHERE user_id=?", (name, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Profile updated successfully"})

@app.route('/receipt/<int:req_id>', methods=['GET'])
def get_receipt(req_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT pr.req_id, u.name, d.file_name, pr.copies, pr.color, pr.cost, pr.request_date
        FROM PrintRequests pr
        JOIN Documents d ON pr.doc_id = d.doc_id
        JOIN Users u ON d.user_id = u.user_id
        WHERE pr.req_id = ?
    """
    cursor.execute(query, (req_id,))
    req = cursor.fetchone()
    conn.close()
    
    if not req:
        return "Not Found", 404
        
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 800, "PrintEase - Payment Receipt")
    c.drawString(100, 780, "="*40)
    c.drawString(100, 750, f"Order ID: REQ-{req['req_id']}")
    c.drawString(100, 730, f"Customer: {req['name']}")
    c.drawString(100, 710, f"Date: {req['request_date']}")
    c.drawString(100, 680, f"Document: {req['file_name']}")
    c.drawString(100, 660, f"Specs: {req['copies']} Copies, {req['color']}")
    c.drawString(100, 640, "-"*40)
    c.drawString(100, 620, f"TOTAL COST: INR {req['cost']}")
    c.save()
    
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"Receipt_REQ{req['req_id']}.pdf", mimetype='application/pdf')

if __name__ == '__main__':
    app.run(debug=True, port=5000)