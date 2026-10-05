@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python est introuvable. Installez Python 3.10 ou une version plus recente, puis relancez ce script.
  pause
  exit /b 1
)

python interface_atlas.py
if errorlevel 1 (
  echo.
  echo Interface Atlas n'a pas pu demarrer.
  pause
  exit /b 1
)

endlocal