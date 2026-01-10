@echo off
echo Starting MesaChef Local Server...
echo Access the application at: http://localhost:8000/restaurante.html
echo (You can close this window to stop the server)
echo.
python -m http.server 8000
pause
