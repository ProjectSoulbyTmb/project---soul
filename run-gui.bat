@echo off
setlocal
cd /d "%~dp0"
title Eidovara Launcher

echo ========================================
echo             Eidovara v0.18.2
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js 22.12 or newer from nodejs.org for the desktop app, then run this file again.
  echo.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found even though Node.js is installed.
  echo Repair/reinstall Node.js, then try again.
  echo.
  pause
  exit /b 1
)

echo Node:
node --version
echo npm:
npm --version
echo.

if not exist node_modules\electron\dist\electron.exe (
  echo Installing Eidovara dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

echo Starting Eidovara...
call npm start
if errorlevel 1 goto :fail
exit /b 0

:fail
echo.
echo Eidovara did not start successfully.
echo The error above is important. Please copy it or send a screenshot.
echo A runtime log may also exist as project-soul.log in the app user-data folder
echo (usually %%APPDATA%%\eidovara while developing, or %%APPDATA%%\Eidovara when installed).
echo.
pause
exit /b 1
