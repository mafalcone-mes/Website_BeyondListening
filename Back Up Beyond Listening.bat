@echo off
rem Double-click to save a backup of all stories and recordings into the "backups" folder.
rem The site must be running (use "Start Beyond Listening" first).
setlocal
cd /d "%~dp0"
title Beyond Listening - backup
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\bootstrap-node.ps1"
if errorlevel 1 goto fail
set "NODE_DIR="
set /p NODE_DIR=<".runtime\node-path.txt"
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"
node scripts\backup.mjs backup
pause
exit /b 0
:fail
pause
exit /b 1
