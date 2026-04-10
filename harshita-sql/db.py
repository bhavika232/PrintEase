import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root123",  # Replace with YOUR password
        database="printing_system"
    )