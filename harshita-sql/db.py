import sqlite3
import os

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'printdesk.db')
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # Initialize tables
    conn.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            balance REAL DEFAULT 500.0
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS Documents (
            doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            file_name TEXT,
            file_path TEXT,
            FOREIGN KEY(user_id) REFERENCES Users(user_id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS PrintRequests (
            req_id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER,
            copies INTEGER,
            color TEXT,
            pages TEXT,
            cost REAL DEFAULT 0.0,
            status TEXT,
            request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(doc_id) REFERENCES Documents(doc_id)
        )
    ''')
    
    # Create default admin if not exists
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM Users WHERE email = ?', ('admin@printdesk.com',))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO Users (name, email, password, role, balance) VALUES ('Admin', 'admin@printdesk.com', 'admin123', 'admin', 9999.9)")
        
    conn.commit()
    return conn