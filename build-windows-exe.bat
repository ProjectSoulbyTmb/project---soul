@echo off
setlocal
cd /d "%~dp0"
call npm install
if errorlevel 1 exit /b 1
call npm test
if errorlevel 1 exit /b 1
call npm run check
if errorlevel 1 exit /b 1
call npm run smoke
if errorlevel 1 exit /b 1
call npm run dist:win
