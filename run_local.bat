@echo off
echo Starting MesaChef Local Server...
echo Access the application at: http://localhost:8000/salones.html
echo (You can close this window to stop the server)
echo.
start http://localhost:8000/salones.html
python -m http.server 8000
pause
