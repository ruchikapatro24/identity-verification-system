@echo off
echo Starting Identity Verification System...
echo.

REM Start the server
start cmd /k "cd /d %~dp0\server && npm start"

REM Wait a moment for server to initialize
timeout /t 3

REM Start the client
start cmd /k "cd /d %~dp0\client && npm start"

echo.
echo Server running at http://localhost:5000
echo Client running at http://localhost:3000
echo.
echo Press any key to exit this window (the application will continue running)
pause > nul 