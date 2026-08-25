import sqlite3
import json

try:
    conn = sqlite3.connect('vdl_manager.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    users = [dict(r) for r in cursor.execute("SELECT * FROM users").fetchall()]
    projects = [dict(r) for r in cursor.execute("SELECT * FROM projects").fetchall()]
    sessions = [dict(r) for r in cursor.execute("SELECT * FROM user_sessions").fetchall()]
    
    status = {
        "users": users,
        "projects": projects,
        "sessions": sessions,
        "error": None
    }
except Exception as e:
    status = {
        "error": str(e)
    }

with open("scratch/db_status.json", "w", encoding="utf-8") as f:
    json.dump(status, f, indent=4)

print("DB check complete. Results written to scratch/db_status.json")
