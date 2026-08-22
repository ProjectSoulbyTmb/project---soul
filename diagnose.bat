@echo off
setlocal
cd /d "%~dp0"
title Project Soul Diagnostics
(
  echo Project Soul diagnostics
  echo Date: %date% %time%
  echo Folder: %cd%
  echo.
  echo === Node ===
  where node
  node --version
  echo.
  echo === npm ===
  where npm
  npm --version
  echo.
  echo === Files ===
  dir package.json
  dir src\electron\main.js
  dir src\electron\preload.cjs
  echo.
  echo === npm dependency check ===
  call npm ls electron electron-builder
) > project-soul-diagnostics.txt 2>&1

type project-soul-diagnostics.txt
echo.
echo Saved: %cd%\project-soul-diagnostics.txt
pause
