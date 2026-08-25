import sys
import os
import json
import sqlite3

# Add parent directory to sys.path to import db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import db

def get_row_val(row, field_name):
    norm_field = field_name.lower().replace(" ", "").strip()
    for k, v in row.items():
        if k.lower().replace(" ", "").strip() == norm_field:
            return v
    return None

def set_row_val(row, field_name, value):
    norm_field = field_name.lower().replace(" ", "").strip()
    for k in list(row.keys()):
        if k.lower().replace(" ", "").strip() == norm_field:
            row[k] = value
            return
    row[field_name] = value

def test_transmittal_database_updates():
    print("Testing Database Transmittal Updates...")
    
    project_id = 5  # "BAB E BUHASA"
    
    # 1. Fetch documents from db for project 5
    docs = db.get_documents(project_id)
    if not docs:
        print("No documents found in project 5 to test with.")
        return
    
    test_doc = docs[0]
    print(f"Original Doc: ID={test_doc['__id']}")
    
    # Let's save original document data to restore later
    original_data = {k: v for k, v in test_doc.items() if k != "__id"}
    
    try:
        # Simulate 'ritorno-cliente'
        suffixes = ["", "1", "2", "3", "4", "5", "6"]
        
        # We will find the first empty Return Code/Date and set it
        filled_ritorno = False
        for suffix in suffixes:
            tr_in_col = f"TR In{suffix}"
            curr_val = get_row_val(test_doc, tr_in_col)
            if curr_val is None or str(curr_val).strip() == "":
                set_row_val(test_doc, f"TR In{suffix}", "TR-RIT-DBTEST")
                set_row_val(test_doc, f"Return Code{suffix}", "B")
                set_row_val(test_doc, f"Return Date{suffix}", "2026-05-20")
                filled_ritorno = True
                print(f"Simulating Return Transmittal set on cycle '{suffix}'")
                break
                
        # Simulate 'invio-cliente'
        filled_invio = False
        for suffix in suffixes:
            tr_out_col = f"TR Out{suffix}"
            curr_val = get_row_val(test_doc, tr_out_col)
            if curr_val is None or str(curr_val).strip() == "":
                set_row_val(test_doc, f"TR Out{suffix}", "TR-OUT-DBTEST")
                set_row_val(test_doc, f"Actual Date{suffix}", "2026-05-21")
                filled_invio = True
                print(f"Simulating Outbound Transmittal set on cycle '{suffix}'")
                break
                
        if not filled_ritorno or not filled_invio:
            print("Warning: could not find empty slots to perform test.")
            return

        # Prepare for save-all API payload simulation
        # recalculate computed fields
        from main import recalculate_computed_fields
        settings = db.get_settings()
        exchange_time = int(settings.get("exchange_time", "15") or "15")
        
        cleaned_row = {k: v for k, v in test_doc.items() if k != "__id"}
        recalculate_computed_fields(cleaned_row, exchange_time)
        
        # Save to DB
        db.update_document(test_doc["__id"], cleaned_row)
        print("Updated document saved to DB.")
        
        # Reload from DB and verify
        reloaded_docs = db.get_documents(project_id)
        reloaded_doc = next(d for d in reloaded_docs if d["__id"] == test_doc["__id"])
        
        # Assertions
        last_code = get_row_val(reloaded_doc, "Last Code receive")
        print(f"Asserting Last Code receive: expected 'B', got '{last_code}'")
        assert last_code == "B", f"Expected last code 'B', got '{last_code}'"
        
        next_forecast = get_row_val(reloaded_doc, "Next issue forecast date")
        # 2026-05-20 + 15 days = 2026-06-04
        expected_forecast = "2026-06-04"
        print(f"Asserting Next issue forecast date: expected '{expected_forecast}', got '{next_forecast}'")
        assert next_forecast == expected_forecast, f"Expected '{expected_forecast}', got '{next_forecast}'"
        
        print("Database Transmittal updates verification PASSED successfully!")
        
    finally:
        # Restore original document data so we don't pollute the user's DB
        db.update_document(test_doc["__id"], original_data)
        print("Original document state restored successfully.")

if __name__ == "__main__":
    test_transmittal_database_updates()
