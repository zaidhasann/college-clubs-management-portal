@echo off
REM Deployment Environment Setup Checklist (Windows)
REM Run this script to validate your environment setup before deployment

echo.
echo Deployment Environment Setup Checker
echo =====================================
echo.

setlocal enabledelayedexpansion
set errors=0

REM Check backend .env
echo Checking Backend Environment...
echo --------------------------------

if exist "backend\.env" (
  echo [OK] backend\.env exists
  
  REM Check required variables in backend/.env
  findstr /c:"PORT=" backend\.env >nul && (
    echo [OK] PORT is set
  ) || (
    echo [ERROR] PORT is not set
    set /a errors+=1
  )
  
  findstr /c:"NODE_ENV=" backend\.env >nul && (
    echo [OK] NODE_ENV is set
  ) || (
    echo [ERROR] NODE_ENV is not set
    set /a errors+=1
  )
  
  findstr /c:"FRONTEND_URL=" backend\.env >nul && (
    echo [OK] FRONTEND_URL is set
  ) || (
    echo [ERROR] FRONTEND_URL is not set
    set /a errors+=1
  )
  
  findstr /c:"MONGODB_URI=" backend\.env >nul && (
    echo [OK] MONGODB_URI is set
  ) || (
    echo [ERROR] MONGODB_URI is not set
    set /a errors+=1
  )
  
  findstr /c:"JWT_SECRET=" backend\.env >nul && (
    echo [OK] JWT_SECRET is set
  ) || (
    echo [ERROR] JWT_SECRET is not set
    set /a errors+=1
  )
  
  findstr /c:"RAZORPAY_KEY_ID=" backend\.env >nul && (
    echo [OK] RAZORPAY_KEY_ID is set
  ) || (
    echo [ERROR] RAZORPAY_KEY_ID is not set
    set /a errors+=1
  )
) else (
  echo [ERROR] backend\.env NOT FOUND
  set /a errors+=1
)

echo.
echo Checking Frontend Environment...
echo ---------------------------------

if exist "frontend\college-club-platform\.env.local" (
  echo [OK] frontend\college-club-platform\.env.local exists
  
  findstr /c:"NEXT_PUBLIC_API_URL=" frontend\college-club-platform\.env.local >nul && (
    echo [OK] NEXT_PUBLIC_API_URL is set
  ) || (
    echo [ERROR] NEXT_PUBLIC_API_URL is not set
    set /a errors+=1
  )
) else (
  echo [ERROR] frontend\college-club-platform\.env.local NOT FOUND
  set /a errors+=1
)

echo.
echo Checking Template Files...
echo --------------------------

if exist "backend\.env.example" (
  echo [OK] backend\.env.example exists
) else (
  echo [ERROR] backend\.env.example NOT FOUND
  set /a errors+=1
)

if exist "frontend\college-club-platform\.env.example" (
  echo [OK] frontend\college-club-platform\.env.example exists
) else (
  echo [ERROR] frontend\college-club-platform\.env.example NOT FOUND
  set /a errors+=1
)

if exist "ENV_SETUP.md" (
  echo [OK] ENV_SETUP.md exists
) else (
  echo [ERROR] ENV_SETUP.md NOT FOUND
  set /a errors+=1
)

echo.
echo =====================================

if %errors% equ 0 (
  echo [SUCCESS] All checks passed! Environment is ready for deployment.
  exit /b 0
) else (
  echo [FAILURE] %errors% error(s) found. Please fix them before deployment.
  exit /b 1
)
