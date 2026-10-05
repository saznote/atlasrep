@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if errorlevel 1 (
  echo Python Launcher "py" est introuvable. Installez Python 3.10+ puis relancez ce script.
  exit /b 1
)

if not exist ".venv-build\Scripts\python.exe" py -3 -m venv .venv-build
call ".venv-build\Scripts\activate.bat"
if errorlevel 1 exit /b 1

python -m pip install --upgrade pip
if errorlevel 1 exit /b 1
python -m pip install -r requirements-build.txt
if errorlevel 1 exit /b 1

python -m PyInstaller --noconfirm --clean --windowed --onedir ^
  --name InterfaceAtlas --collect-all mss --collect-all PIL interface_atlas.py
if errorlevel 1 exit /b 1

echo.
echo Application portable creee dans : %CD%\dist\InterfaceAtlas

set "ISCC="
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not defined ISCC if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"

if defined ISCC (
  "%ISCC%" "InterfaceAtlas.iss"
  if errorlevel 1 exit /b 1
  echo Installateur cree dans : %CD%\dist\InterfaceAtlas-Setup.exe
) else (
  echo Installateur non compile : installez Inno Setup 6 puis relancez ce script.
  echo Le dossier portable ci-dessus reste utilisable sans installation.
)
endlocal
