import sys
sys.path.insert(0, r"c:\Users\lbeneforti\OneDrive - Satiz TPM\Desktop\Project\VDL Manager")

import traceback
import db

# Simulate exactly what send_reminder does
project_id = 3
hands_value = "PROVA"
exchange_time = 15
language = "it"
sender_email = ""
subject = "TEST"
additional_notes = ""

try:
    from main import (
        generate_html_email, calculate_reminders, 
        ReminderCalculateRequest, EmailSendRequest
    )
    
    project = db.get_project(project_id)
    print("Project:", project)
    
    settings = db.get_settings()
    print("Settings:", settings)
    email_mode = settings.get("email_mode", "outlook").lower()
    print("Email mode:", email_mode)
    
    calc_res = calculate_reminders(ReminderCalculateRequest(
        project_id=project_id,
        hands_value=hands_value,
        exchange_time=exchange_time,
        language=language
    ))
    overdue_docs = calc_res.get("overdue_documents", [])
    print(f"Overdue docs count: {len(overdue_docs)}")
    
    contacts = db.get_contacts(project_id)
    contact = contacts.get(hands_value, {"to": "", "cc": ""})
    print("Contact:", contact)
    
    to_emails = str(contact.get("to") or "").strip()
    cc_emails = str(contact.get("cc") or "").strip()
    print(f"To: '{to_emails}', CC: '{cc_emails}'")
    
    if not to_emails:
        print("ERROR: No recipient configured!")
    else:
        html_content = generate_html_email(hands_value, overdue_docs, exchange_time, additional_notes, language)
        print("HTML generated OK, length:", len(html_content))
        
        # Try Outlook
        print("\nTrying Outlook COM...")
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        try:
            outlook = win32com.client.Dispatch("Outlook.Application")
            mail = outlook.CreateItem(0)
            mail.Display(False)
            mail.To = to_emails
            mail.CC = cc_emails
            mail.Subject = subject
            existing_body = mail.HTMLBody or ""
            mail.HTMLBody = html_content + existing_body
            print("SUCCESS: Mail composed!")
        except Exception as ex:
            print("Outlook error:", ex)
            traceback.print_exc()
        finally:
            pythoncom.CoUninitialize()

except Exception as e:
    print("CRASH:", e)
    traceback.print_exc()
