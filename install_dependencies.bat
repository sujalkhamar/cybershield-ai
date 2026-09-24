@echo off
echo =======================================================
echo CyberShield-AI: Automated Dependency Installer
echo =======================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not added to PATH.
    pause
    exit /b
)

echo [1/3] Creating a virtual environment (venv)...
python -m venv venv

echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/3] Installing dependencies from dependencies\requirements.txt...
pip install --upgrade pip
pip install -r dependencies\requirements.txt

echo.
echo =======================================================
echo [SUCCESS] All dependencies have been installed successfully!
echo.
echo To run your code, make sure to activate the environment first by typing:
echo venv\Scripts\activate
echo =======================================================
pause
