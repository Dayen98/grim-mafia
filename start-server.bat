@echo off
REM ============================================
REM  Grim Mafia - server launcher
REM  Auto-restarts the server if it ever stops.
REM  Output (including crashes) goes to server.log
REM  Close this window to stop completely.
REM ============================================
title Grim Mafia Server
cd /d "%~dp0"

:loop
echo.
echo [%time%] Starting server...  ^(http://localhost:3000^)
echo [%time%] ---- server start ---- >> server.log
node server.js >> server.log 2>&1
echo.
echo [%time%] Server stopped. See server.log . Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
