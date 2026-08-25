import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vdl_manager.db")

def get_db_connection():
    # Aumentato il timeout a 30 secondi per evitare lock prematuri
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    # Enable Write-Ahead Logging for high concurrency without locks
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vdl_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT,
            contractor TEXT,
            contractor_proj_num TEXT,
            vendor_proj_num TEXT,
            project_name TEXT NOT NULL,
            columns TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vdl_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            document_data TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES vdl_projects(id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            hands_value TEXT NOT NULL,
            to_emails TEXT,
            cc_emails TEXT,
            FOREIGN KEY (project_id) REFERENCES vdl_projects(id) ON DELETE CASCADE,
            UNIQUE(project_id, hands_value)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT
        )
    """)
    
    # New tables for Supplier registry, Project assignments, and Supplier Transmittals
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vdl_suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            item TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS project_suppliers (
            project_id INTEGER NOT NULL,
            supplier_id INTEGER NOT NULL,
            PRIMARY KEY (project_id, supplier_id),
            FOREIGN KEY (project_id) REFERENCES vdl_projects(id) ON DELETE CASCADE,
            FOREIGN KEY (supplier_id) REFERENCES vdl_suppliers(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS supplier_transmittals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            supplier_id INTEGER NOT NULL,
            direction TEXT NOT NULL,
            tr_number TEXT NOT NULL,
            tr_date TEXT NOT NULL,
            notes TEXT DEFAULT '',
            document_list TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES vdl_projects(id) ON DELETE CASCADE,
            FOREIGN KEY (supplier_id) REFERENCES vdl_suppliers(id) ON DELETE CASCADE
        )
    """)
    
    # Nuova tabella per VDL Fornitori
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vdl_supplier_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            supplier_id INTEGER NOT NULL,
            document_data TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES vdl_projects(id) ON DELETE CASCADE,
            FOREIGN KEY (supplier_id) REFERENCES vdl_suppliers(id) ON DELETE CASCADE
        )
    """)
    
    # Nuove tabelle per gestione accessi utente
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Seeding utente ADMIN di default
    cursor.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES ('ADMIN', 'ADMIN', 'Admin')")
    
    # Aggiungi dinamicamente colonna 'columns' a project_suppliers esistente
    try:
        cursor.execute("ALTER TABLE project_suppliers ADD COLUMN columns TEXT DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass # Colonna già esistente

    # Aggiungi dinamicamente colonne a vdl_projects per path e revisioni
    try:
        cursor.execute("ALTER TABLE vdl_projects ADD COLUMN job_path TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE vdl_projects ADD COLUMN revision_format TEXT DEFAULT 'numeric'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE vdl_projects ADD COLUMN revision_columns TEXT DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass
    
    # Initialize some default email settings if not present
    cursor.execute("INSERT OR IGNORE INTO email_settings (setting_key, setting_value) VALUES (?, ?)", ("sender_email", ""))
    cursor.execute("INSERT OR IGNORE INTO email_settings (setting_key, setting_value) VALUES (?, ?)", ("smtp_server", "smtp.gmail.com"))
    cursor.execute("INSERT OR IGNORE INTO email_settings (setting_key, setting_value) VALUES (?, ?)", ("smtp_port", "587"))
    cursor.execute("INSERT OR IGNORE INTO email_settings (setting_key, setting_value) VALUES (?, ?)", ("smtp_user", ""))
    cursor.execute("INSERT OR IGNORE INTO email_settings (setting_key, setting_value) VALUES (?, ?)", ("smtp_password", ""))
    cursor.execute("INSERT OR IGNORE INTO email_settings (setting_key, setting_value) VALUES (?, ?)", ("email_mode", "outlook"))
    cursor.execute("INSERT OR IGNORE INTO email_settings (setting_key, setting_value) VALUES (?, ?)", ("exchange_time", "15"))

    conn.commit()
    conn.close()

# --- PROJECTS ---
def create_project(company, contractor, contractor_proj_num, vendor_proj_num, project_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vdl_projects (company, contractor, contractor_proj_num, vendor_proj_num, project_name) VALUES (?, ?, ?, ?, ?)",
        (company, contractor, contractor_proj_num, vendor_proj_num, project_name)
    )
    project_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return project_id

def get_all_projects():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vdl_projects ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    projects = []
    for r in rows:
        keys = r.keys()
        projects.append({
            "id": r["id"],
            "company": r["company"],
            "contractor": r["contractor"],
            "contractor_proj_num": r["contractor_proj_num"],
            "vendor_proj_num": r["vendor_proj_num"],
            "project_name": r["project_name"],
            "columns": json.loads(r["columns"]) if r["columns"] else [],
            "job_path": r["job_path"] if "job_path" in keys else "",
            "revision_format": r["revision_format"] if "revision_format" in keys else "numeric",
            "revision_columns": json.loads(r["revision_columns"]) if ("revision_columns" in keys and r["revision_columns"]) else [],
            "created_at": r["created_at"]
        })
    return projects

def get_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vdl_projects WHERE id = ?", (project_id,))
    r = cursor.fetchone()
    conn.close()
    if r:
        keys = r.keys()
        return {
            "id": r["id"],
            "company": r["company"],
            "contractor": r["contractor"],
            "contractor_proj_num": r["contractor_proj_num"],
            "vendor_proj_num": r["vendor_proj_num"],
            "project_name": r["project_name"],
            "columns": json.loads(r["columns"]) if r["columns"] else [],
            "job_path": r["job_path"] if "job_path" in keys else "",
            "revision_format": r["revision_format"] if "revision_format" in keys else "numeric",
            "revision_columns": json.loads(r["revision_columns"]) if ("revision_columns" in keys and r["revision_columns"]) else [],
            "created_at": r["created_at"]
        }
    return None

def update_project_path_and_revisions(project_id, job_path, revision_format, revision_columns):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE vdl_projects SET job_path = ?, revision_format = ?, revision_columns = ? WHERE id = ?",
        (job_path, revision_format, json.dumps(revision_columns), project_id)
    )
    conn.commit()
    conn.close()

def update_project_metadata(project_id, company, contractor, contractor_proj_num, vendor_proj_num, project_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE vdl_projects SET company = ?, contractor = ?, contractor_proj_num = ?, vendor_proj_num = ?, project_name = ? WHERE id = ?",
        (company, contractor, contractor_proj_num, vendor_proj_num, project_name, project_id)
    )
    conn.commit()
    conn.close()

def get_current_project():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vdl_projects ORDER BY id DESC LIMIT 1")
    r = cursor.fetchone()
    conn.close()
    if r:
        return get_project(r["id"])
    return None

def update_project_columns(project_id, columns):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE vdl_projects SET columns = ? WHERE id = ?",
        (json.dumps(columns), project_id)
    )
    conn.commit()
    conn.close()

# --- VDL DOCUMENTS ---
def save_vdl_project(project_id, columns, rows):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Delete old documents for this specific project
    cursor.execute("DELETE FROM vdl_documents WHERE project_id = ?", (project_id,))
    
    # Update columns
    cursor.execute(
        "UPDATE vdl_projects SET columns = ? WHERE id = ?",
        (json.dumps(columns), project_id)
    )
    
    for row in rows:
        cursor.execute(
            "INSERT INTO vdl_documents (project_id, document_data) VALUES (?, ?)",
            (project_id, json.dumps(row))
        )
        
    conn.commit()
    conn.close()

def get_documents(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vdl_documents WHERE project_id = ?", (project_id,))
    rows = cursor.fetchall()
    conn.close()
    
    documents = []
    for row in rows:
        data = json.loads(row["document_data"])
        data["__id"] = row["id"]
        documents.append(data)
    return documents

def add_document(project_id, document_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vdl_documents (project_id, document_data) VALUES (?, ?)",
        (project_id, json.dumps(document_data))
    )
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return doc_id

def update_document(doc_id, document_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE vdl_documents SET document_data = ? WHERE id = ?",
        (json.dumps(document_data), doc_id)
    )
    conn.commit()
    conn.close()

def delete_document(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vdl_documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

# --- CONTACTS ---
def get_contacts(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM contacts WHERE project_id = ?", (project_id,))
    rows = cursor.fetchall()
    conn.close()
    return {row["hands_value"]: {"to": row["to_emails"], "cc": row["cc_emails"]} for row in rows}

def save_contact(project_id, hands_value, to_emails, cc_emails):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO contacts (project_id, hands_value, to_emails, cc_emails) VALUES (?, ?, ?, ?) "
        "ON CONFLICT(project_id, hands_value) DO UPDATE SET to_emails=excluded.to_emails, cc_emails=excluded.cc_emails",
        (project_id, hands_value.strip(), to_emails.strip(), cc_emails.strip())
    )
    conn.commit()
    conn.close()

def delete_contact(project_id, hands_value):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contacts WHERE project_id = ? AND hands_value = ?", (project_id, hands_value))
    conn.commit()
    conn.close()


def delete_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vdl_documents WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM contacts WHERE project_id = ?", (project_id,))
    cursor.execute("DELETE FROM vdl_projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()


# --- EMAIL SETTINGS ---
def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT setting_key, setting_value FROM email_settings")
    rows = cursor.fetchall()
    conn.close()
    return {row["setting_key"]: row["setting_value"] for row in rows}

def save_settings(settings_dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    for key, value in settings_dict.items():
        cursor.execute(
            "INSERT INTO email_settings (setting_key, setting_value) VALUES (?, ?) "
            "ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value",
            (key, str(value) if value is not None else "")
        )
    conn.commit()
    conn.close()

def save_setting(key, value):
    save_settings({key: value})


# --- SUPPLIERS & PROJECT ASSIGNMENTS ---

def get_all_suppliers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vdl_suppliers ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "item": r["item"]} for r in rows]

def create_supplier(name, item):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO vdl_suppliers (name, item) VALUES (?, ?)", (name.strip(), item.strip()))
    sid = cursor.lastrowid
    conn.commit()
    conn.close()
    return sid

def update_supplier(supplier_id, name, item):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE vdl_suppliers SET name = ?, item = ? WHERE id = ?", (name.strip(), item.strip(), supplier_id))
    conn.commit()
    conn.close()

def delete_supplier(supplier_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vdl_suppliers WHERE id = ?", (supplier_id,))
    conn.commit()
    conn.close()

def get_project_suppliers(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.* FROM vdl_suppliers s
        JOIN project_suppliers ps ON s.id = ps.supplier_id
        WHERE ps.project_id = ?
        ORDER BY s.name ASC
    """, (project_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "item": r["item"]} for r in rows]

def save_project_suppliers(project_id, supplier_ids):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Clear existing assignments for this project
    cursor.execute("DELETE FROM project_suppliers WHERE project_id = ?", (project_id,))
    for sid in supplier_ids:
        cursor.execute("INSERT INTO project_suppliers (project_id, supplier_id) VALUES (?, ?)", (project_id, sid))
    conn.commit()
    conn.close()

# --- SUPPLIER TRANSMITTALS ---

def get_supplier_transmittals(project_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.*, s.name as supplier_name, s.item as supplier_item 
        FROM supplier_transmittals t
        JOIN vdl_suppliers s ON t.supplier_id = s.id
        WHERE t.project_id = ?
        ORDER BY t.tr_date DESC, t.id DESC
    """, (project_id,))
    rows = cursor.fetchall()
    conn.close()
    
    transmittals = []
    for r in rows:
        transmittals.append({
            "id": r["id"],
            "project_id": r["project_id"],
            "supplier_id": r["supplier_id"],
            "supplier_name": r["supplier_name"],
            "supplier_item": r["supplier_item"],
            "direction": r["direction"],
            "tr_number": r["tr_number"],
            "tr_date": r["tr_date"],
            "notes": r["notes"],
            "document_list": json.loads(r["document_list"]) if r["document_list"] else [],
            "created_at": r["created_at"]
        })
    return transmittals

def create_supplier_transmittal(project_id, supplier_id, direction, tr_number, tr_date, notes, document_list):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO supplier_transmittals (project_id, supplier_id, direction, tr_number, tr_date, notes, document_list)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (project_id, supplier_id, direction, tr_number.strip(), tr_date.strip(), notes.strip(), json.dumps(document_list)))
    tr_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return tr_id

def delete_supplier_transmittal(tr_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM supplier_transmittals WHERE id = ?", (tr_id,))
    conn.commit()
    conn.close()

# --- SUPPLIER VDL DOCUMENTS ---

def get_project_supplier_columns(project_id, supplier_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT columns FROM project_suppliers WHERE project_id = ? AND supplier_id = ?", (project_id, supplier_id))
    r = cursor.fetchone()
    conn.close()
    if r and r["columns"]:
        return json.loads(r["columns"])
    return []

def set_project_supplier_columns(project_id, supplier_id, columns):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE project_suppliers SET columns = ? WHERE project_id = ? AND supplier_id = ?", (json.dumps(columns), project_id, supplier_id))
    conn.commit()
    conn.close()

def get_supplier_documents(project_id, supplier_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vdl_supplier_documents WHERE project_id = ? AND supplier_id = ? ORDER BY id ASC", (project_id, supplier_id))
    rows = cursor.fetchall()
    conn.close()
    documents = []
    for r in rows:
        doc = json.loads(r["document_data"])
        doc["__id"] = r["id"]  # Internal ID for updates
        documents.append(doc)
    return documents

def save_supplier_documents(project_id, supplier_id, documents):
    """
    documents is a list of dicts. If '__id' exists, it updates.
    Otherwise it inserts.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for doc in documents:
        doc_id = doc.get("__id")
        # remove internal tracking keys before saving JSON
        save_data = {k: v for k, v in doc.items() if not k.startswith("__") and k != "is_dirty"}
        
        if doc_id:
            cursor.execute("UPDATE vdl_supplier_documents SET document_data = ? WHERE id = ? AND project_id = ? AND supplier_id = ?", 
                           (json.dumps(save_data), doc_id, project_id, supplier_id))
        else:
            cursor.execute("INSERT INTO vdl_supplier_documents (project_id, supplier_id, document_data) VALUES (?, ?, ?)", 
                           (project_id, supplier_id, json.dumps(save_data)))
                           
    conn.commit()
    conn.close()

def clear_supplier_documents(project_id, supplier_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vdl_supplier_documents WHERE project_id = ? AND supplier_id = ?", (project_id, supplier_id))
    conn.commit()
    conn.close()

def update_supplier_project_columns(project_id, supplier_id, new_columns_schema):
    """
    Updates the supplier VDL schema and injects empty values for new columns into all existing documents.
    """
    current_docs = get_supplier_documents(project_id, supplier_id)
    
    set_project_supplier_columns(project_id, supplier_id, new_columns_schema)
    
    # Update documents
    for doc in current_docs:
        doc_id = doc.get("__id")
        updated_data = {}
        for col in new_columns_schema:
            updated_data[col] = doc.get(col, "")
            
        cursor = get_db_connection().cursor()
        cursor.execute("UPDATE vdl_supplier_documents SET document_data = ? WHERE id = ?", (json.dumps(updated_data), doc_id))
        cursor.connection.commit()
        cursor.connection.close()


# --- USERS & AUTH ---

def create_user(username, password, role):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (username.strip(), password.strip(), role.strip())
        )
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username.strip(),))
    r = cursor.fetchone()
    conn.close()
    if r:
        return {
            "id": r["id"],
            "username": r["username"],
            "password": r["password"],
            "role": r["role"],
            "created_at": r["created_at"]
        }
    return None

def get_user_by_token(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.* FROM users u
        JOIN user_sessions s ON u.id = s.user_id
        WHERE s.token = ?
    """, (token,))
    r = cursor.fetchone()
    conn.close()
    if r:
        return {
            "id": r["id"],
            "username": r["username"],
            "password": r["password"],
            "role": r["role"],
            "created_at": r["created_at"]
        }
    return None

def create_session(user_id, token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO user_sessions (token, user_id) VALUES (?, ?)",
        (token, user_id)
    )
    conn.commit()
    conn.close()

def delete_session(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r["id"],
        "username": r["username"],
        "password": r["password"],
        "role": r["role"],
        "created_at": r["created_at"]
    } for r in rows]

def update_user(user_id, username, password, role):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?",
        (username.strip(), password.strip(), role.strip(), user_id)
    )
    conn.commit()
    conn.close()

def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

def get_project_id_by_doc_id(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT project_id FROM vdl_documents WHERE id = ?", (doc_id,))
    r = cursor.fetchone()
    conn.close()
    return r["project_id"] if r else None


