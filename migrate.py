import sqlite3
import pyodbc
import os

db_path = "backend/opportunities.db"
if os.path.exists("opportunities.db"):
    if os.path.getsize("opportunities.db") > os.path.getsize("backend/opportunities.db"):
        db_path = "opportunities.db"

try:
    print(f"Connecting to old SQLite database at {db_path}...")
    sqlite_conn = sqlite3.connect(db_path)
    sqlite_cur = sqlite_conn.cursor()
    sqlite_cur.execute("SELECT title, description, category, deadline, url, created_at FROM opportunities")
    rows = sqlite_cur.fetchall()
    print(f"Found {len(rows)} old opportunities.")
except Exception as e:
    print("Could not read SQLite database.")
    print(e)
    rows = []

# 2. Connect to new Microsoft SQL Server
CONN_STR = (
    r"DRIVER={SQL Server};"
    r"SERVER=SHIVENDRA\SQLEXPRESS;"
    r"DATABASE=CareerMotive;"
    r"Trusted_Connection=yes;"
)

try:
    if rows:
        print("Connecting to MS SQL Server...")
        sql_conn = pyodbc.connect(CONN_STR, autocommit=True)
        sql_cur = sql_conn.cursor()

        count = 0
        for row in rows:
            # We map row directly because the columns match exactly
            sql_cur.execute(
                "INSERT INTO opportunities (title, description, category, deadline, url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                row
            )
            count += 1
        
        sql_conn.close()
        sqlite_conn.close()
        print(f"Successfully migrated {count} posts to SSMS!")
    else:
        print("No rows to migrate.")
except Exception as e:
    print("Error writing to SQL Server!")
    print(e)
