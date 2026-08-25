import sys
import time
import win32com.client as win32
import pythoncom

def test_account(email, name):
    try:
        pythoncom.CoInitialize()
        outlook = win32.Dispatch('outlook.application')
        mail = outlook.CreateItem(0)
        
        # Set SentOnBehalfOfName BEFORE Displaying
        mail.SentOnBehalfOfName = email
        mail.Display(False)
        time.sleep(1.0)
        
        sig = mail.HTMLBody or ""
        print(f"\n--- Account {email} ({name}) ---")
        print("Length:", len(sig))
        
        # Check keywords
        contains_tosi = "tosi" in sig.lower() or "francotosimeccanica" in sig.lower()
        contains_emtb = "emtb" in sig.lower()
        contains_satiz = "satiz" in sig.lower()
        
        print("Contains 'tosi/francotosimeccanica':", contains_tosi)
        print("Contains 'emtb':", contains_emtb)
        print("Contains 'satiz':", contains_satiz)
        
        # Write to a file for manual inspection
        with open(f"sig_{name}.html", "w", encoding="utf-8") as f:
            f.write(sig)
        print(f"Saved to sig_{name}.html")
        
        mail.Close(1) # Discard
    except Exception as e:
        print("Error:", e)
    finally:
        pythoncom.CoUninitialize()

if __name__ == "__main__":
    test_account("luca.beneforti@emtb.it", "emtb")
    test_account("luca.beneforti@francotosimeccanica.it", "tosi")
