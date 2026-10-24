~@echo off
echo ================================================
echo  AI Legal Document Simplifier ^& Risk Analyzer
echo  Team-2 - CSE-Q - 3rd B.Tech
echo ================================================
echo.

REM Check if GROQ_API_KEY is set
findstr /C:"your_groq_api_key_here" backend\.env >nul 2>&1
if %errorlevel% == 0 (
    echo [WARNING] Please set your GROQ_API_KEY in backend\.env before running!
    echo    1. Go to https://console.groq.com to get a free API key
    echo    2. Open backend\.env and replace "your_groq_api_key_here" with your key
    echo.
    pause
)

echo Starting Backend (FastAPI on port 8000)...
start cmd /k "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for backend to start...
timeout /t 4 /nobreak > nul

echo Starting Frontend (React on port 3000)...
start cmd /k "cd frontend && npm run dev"

echo.
echo ================================================
echo  App is starting up!
echo  Frontend: http://localhost:3000
echo  Backend API: http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ================================================
echo.
timeout /t 3 /nobreak > nul
start http://localhost:3000
