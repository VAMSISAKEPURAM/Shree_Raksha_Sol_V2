@echo off
setlocal enabledelayedexpansion
title Shreeraksha Solutions GST Suite

:: 1. Ensure current working directory is always this folder
cd /d "%~dp0"

echo ======================================================================
echo           SHREERAKSHA SOLUTIONS - GST BILLING ^& INVOICE SUITE
echo ======================================================================
echo.

:: 2. Find Python executable (check 'python' then 'py')
set "PY_CMD="
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PY_CMD=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "PY_CMD=py"
    )
)

if "%PY_CMD%"=="" (
    echo [ERROR] Python is not installed or not in your system PATH!
    echo Please install Python 3.9 or higher and check "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

:: 3. Try starting MySQL service if installed (silent if access requires elevation)
net start MYSQL80 >nul 2>&1

:: 4. Check if port 8080 is already active
netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [i] Server is already active on http://127.0.0.1:8080
    echo [*] Opening application in your default browser...
    start "" "http://127.0.0.1:8080"
    echo.
    echo Application opened in browser. You can safely close this window.
    timeout /t 5 >nul
    exit /b 0
)

:: 5. Launch browser after 2 seconds (so server binds to socket first)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:8080"

:: 6. Start the Python Flask backend server
echo [*] Starting backend server on http://127.0.0.1:8080 ...
echo [*] Keep this window open while using the application.
echo [*] Press CTRL+C to stop the server.
echo.
%PY_CMD% app.py

:: 7. If python exits unexpectedly, prevent window from instantly closing
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo [!] Server stopped with error code %ERRORLEVEL%.
    echo ======================================================================
    pause
)
