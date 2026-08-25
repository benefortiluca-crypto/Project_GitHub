@echo off
title VDL Manager Pro Server
echo ==============================================
echo       Avvio Server VDL Manager Pro...
echo ==============================================
echo.
echo Il browser si aprira' automaticamente tra pochi secondi.
echo IMPORTANTE: Non chiudere questa finestra nera finche' 
echo             utilizzi l'applicazione.
echo.
start http://127.0.0.1:8000
python main.py
pause
