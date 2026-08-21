@echo off
setlocal
cd /d "%~dp0"
title Eidovara CLI

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js 20 LTS or newer from nodejs.org, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing Eidovara dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

echo Starting Eidovara CLI...
call npm run cli
if errorlevel 1 goto :fail
exit /b 0

:fail
echo.
echo Eidovara CLI did not start successfully.
echo.
pause
exit /b 1
