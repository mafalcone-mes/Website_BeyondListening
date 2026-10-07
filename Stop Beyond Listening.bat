@echo off
rem Double-click to stop Beyond Listening and its local database (your data is kept).
setlocal
cd /d "%~dp0"
title Beyond Listening - stop
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\bootstrap-node.ps1"
if errorlevel 1 goto fail
set "NODE_DIR="
set /p NODE_DIR=<".runtime\node-path.txt"
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"
node scripts\launcher.mjs stop
timeout /t 8
exit /b 0
:fail
pause
exit /b 1
