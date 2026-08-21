@echo off
setlocal
cd /d "%~dp0"
title Eidovara CLI
echo Eidovara v0.18.2 command-line Soul
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found. Install Node.js 20 or newer, then try again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
call npm run cli %*
