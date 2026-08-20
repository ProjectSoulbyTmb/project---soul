@echo off
setlocal
cd /d "%~dp0"
title Project Soul Launcher

echo ========================================
echo        Project Soul Alpha v.0.15
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js 20 LTS or newer from nodejs.org, then run this file again.
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
  echo Installing Project Soul dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

echo Starting Project Soul...
call npm start
if errorlevel 1 goto :fail
exit /b 0

:fail
echo.
echo Project Soul did not start successfully.
echo The error above is important. Please copy it or send a screenshot.
echo A runtime log may also exist under:
echo %%APPDATA%%\project-soul-js-gui\project-soul.log
echo.
pause
exit /b 1
