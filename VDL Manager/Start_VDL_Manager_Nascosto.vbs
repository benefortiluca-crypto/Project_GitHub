Set WshShell = CreateObject("WScript.Shell")
' Avvia il server Python in modalità nascosta (0)
WshShell.Run "cmd.exe /c python main.py", 0, False
' Attendi 2 secondi per dare tempo al server di avviarsi
WScript.Sleep 2000
' Apri il browser all'indirizzo locale
WshShell.Run "http://127.0.0.1:8000"
