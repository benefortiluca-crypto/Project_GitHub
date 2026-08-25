import sqlite3
import json

conn = sqlite3.connect("vdl_manager.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute("SELECT * FROM vdl_documents")
rows = cursor.fetchall()
for r in rows:
    data = json.loads(r["document_data"])
    for k, v in data.items():
        if "4660" in str(v):
            print(f"Document ID: {r['id']}")
            print(json.dumps(data, indent=2))
            break

conn.close()
