@echo off
rem Double-click to start Beyond Listening on Windows.
setlocal
cd /d "%~dp0"
title Beyond Listening
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\bootstrap-node.ps1"
if errorlevel 1 goto fail
set "NODE_DIR="
set /p NODE_DIR=<".runtime\node-path.txt"
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"
node scripts\launcher.mjs start
exit /b %errorlevel%
:fail
echo.
echo Could not prepare Node.js.
pause
exit /b 1
