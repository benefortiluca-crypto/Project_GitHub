import sqlite3
import json
import os
import sys

# Add parent directory to path to import db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db

def migrate():
    conn = db.get_db_connection()
    cursor = conn.cursor()
    
    # 1. Update vdl_projects columns
    cursor.execute("SELECT id, columns FROM vdl_projects")
    projects = cursor.fetchall()
    
    for row in projects:
        proj_id = row["id"]
        cols = json.loads(row["columns"]) if row["columns"] else []
        if cols and "Internal Document Number" not in cols:
            # Find index of Hands if exists, else 0
            if "Hands" in cols:
                idx = cols.index("Hands")
                cols.insert(idx, "Internal Document Number")
            else:
                cols.insert(0, "Internal Document Number")
                
            cursor.execute("UPDATE vdl_projects SET columns = ? WHERE id = ?", (json.dumps(cols), proj_id))
            
    # 2. Update project_suppliers columns
    cursor.execute("SELECT project_id, supplier_id, columns FROM project_suppliers")
    suppliers = cursor.fetchall()
    
    for row in suppliers:
        proj_id = row["project_id"]
        supp_id = row["supplier_id"]
        cols = json.loads(row["columns"]) if row["columns"] else []
        if cols and "Internal Document Number" not in cols:
            if "Hands" in cols:
                idx = cols.index("Hands")
                cols.insert(idx, "Internal Document Number")
            else:
                cols.insert(0, "Internal Document Number")
                
            cursor.execute("UPDATE project_suppliers SET columns = ? WHERE project_id = ? AND supplier_id = ?", 
                           (json.dumps(cols), proj_id, supp_id))
            
    conn.commit()
    conn.close()
    print("Migrazione colonne completata con successo.")

if __name__ == "__main__":
    migrate()
