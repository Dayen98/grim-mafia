@echo off
REM ============================================
REM  Grim Mafia - server + public tunnel
REM  The https://... address shown below is the
REM  link to share with friends.
REM ============================================
title Grim Mafia Launcher
cd /d "%~dp0"

start "Grim Mafia Server" "%~dp0start-server.bat"
echo Waiting for the server to come up...
timeout /t 5 /nobreak >nul

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo cloudflared not found - running locally only.
  echo   This PC : http://localhost:3000
  echo.
  pause
  exit /b
)

echo.
echo Opening public tunnel. Share the https://...trycloudflare.com link below.
echo Closing this window ends outside access ^(the game keeps running locally^).
echo.
cloudflared tunnel --url http://localhost:3000 --no-autoupdate