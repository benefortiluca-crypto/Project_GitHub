import requests
import json

# Get real project id from DB
import sqlite3
conn = sqlite3.connect('vdl_manager.db')
projects = conn.execute("SELECT id, company FROM vdl_projects").fetchall()
print("Projects:", projects)

if not projects:
    print("NO PROJECTS FOUND - this is why it fails!")
    exit()

proj_id = projects[0][0]
print(f"Using project_id={proj_id}")

# Get a hands value
docs = conn.execute("SELECT document_data FROM vdl_documents WHERE project_id=?", (proj_id,)).fetchall()
hands_val = None
for row in docs:
    d = json.loads(row[0])
    if d.get('Hands'):
        hands_val = d['Hands']
        break

print(f"Hands value found: {hands_val}")
conn.close()

# If no hands, use empty string
hands_val = hands_val or "TEST"

# Test the calculate endpoint
print("\n--- Testing /api/reminder/calculate ---")
r = requests.post("http://127.0.0.1:8000/api/reminder/calculate", json={
    "project_id": proj_id,
    "hands_value": hands_val,
    "exchange_time": 15,
    "language": "it"
})
print("Status:", r.status_code)
print("Response:", r.text[:500])

# Test the send endpoint
print("\n--- Testing /api/reminder/send ---")
r2 = requests.post("http://127.0.0.1:8000/api/reminder/send", json={
    "project_id": proj_id,
    "hands_value": hands_val,
    "exchange_time": 15,
    "sender_email": "",
    "subject": "TEST SUBJECT",
    "additional_notes": "",
    "language": "it"
})
print("Status:", r2.status_code)
print("Response:", r2.text[:1000])
