import sqlite3
import json
conn = sqlite3.connect('vdl_manager.db')
docs = conn.execute("SELECT project_id, document_data FROM vdl_documents").fetchall()
for row in docs:
    pid = row[0]
    d = json.loads(row[1])
    if d.get('Hands'):
        print(f"Project ID: {pid}")
        print(d)
        break
