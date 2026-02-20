@echo off
REM Jarvis-Board Quick Setup Script
REM Run this in PowerShell or Command Prompt

echo 🤖 Jarvis-Board Setup
echo ========================
echo.

REM Check if git is installed
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Install Git first: https://git-scm.com
    exit /b 1
)

REM Check if gh is installed
where gh >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ GitHub CLI not found. Install from: https://cli.github.com
    echo.
) else (
    echo ✅ GitHub CLI found
)

echo.
echo 📋 Step 1: Create GitHub Repository
echo ------------------------------------
echo 1. Go to: https://github.com/new
echo 2. Repository name: jarvis-board
echo 3. Select: Private
echo 4. Click: Create repository
echo.
echo After creating, copy the URL (e.g., https://github.com/YOURNAME/jarvis-board.git)
echo.

set /p REPO_URL="Paste your GitHub repo URL: "

echo.
echo 📤 Step 2: Push to GitHub
echo ----------------------------
cd /d "%~dp0"
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo ✅ Done! Repository pushed to GitHub.
echo.
echo 📦 Next: Deploy to Vercel
echo ---------------------------
echo 1. Go to: https://vercel.com
echo 2. Import: jarvis-board
echo 3. Add environment variables:
echo    - NEXT_PUBLIC_SUPABASE_URL = [from Supabase]
echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY = [from Supabase]
echo    - AUTH_PASSWORD = jarvis2026
echo 4. Deploy!
echo.
echo 🗄️ Then run supabase_schema.sql in Supabase SQL Editor
echo.
pause
