@echo off
echo ========================================
echo Starting Attendance System
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd client && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo Servers Starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser...
timeout /t 5 /nobreak > nul
start http://localhost:5173
echo.
echo ========================================
echo Login Credentials:
echo ========================================
echo Admin:   admin@example.com / admin123
echo Faculty: faculty@example.com / faculty123
echo Student: alice@example.com / student123
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
