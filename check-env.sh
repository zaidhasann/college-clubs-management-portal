#!/bin/bash

# Deployment Environment Setup Checklist
# Run this script to validate your environment setup before deployment

echo "🔍 College Club Management - Environment Setup Checker"
echo "======================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
  else
    echo -e "${RED}✗${NC} $1 NOT FOUND"
    ((errors++))
  fi
}

# Function to check environment variable
check_env_var() {
  local var_name="$1"
  local file_path="$2"
  local value=$(grep "^$var_name=" "$file_path" | cut -d'=' -f2)
  
  if [ -z "$value" ]; then
    echo -e "${RED}✗${NC} $var_name is not set in $file_path"
    ((errors++))
  else
    # Mask sensitive values
    if [[ "$var_name" == *"SECRET"* ]] || [[ "$var_name" == *"KEY"* ]]; then
      echo -e "${GREEN}✓${NC} $var_name is set (value hidden)"
    else
      echo -e "${GREEN}✓${NC} $var_name = $value"
    fi
  fi
}

echo "📋 Checking Backend Environment..."
echo "-----------------------------------"
if [ -f "backend/.env" ]; then
  echo -e "${GREEN}✓${NC} backend/.env exists"
  check_env_var "PORT" "backend/.env"
  check_env_var "NODE_ENV" "backend/.env"
  check_env_var "FRONTEND_URL" "backend/.env"
  check_env_var "MONGODB_URI" "backend/.env"
  check_env_var "JWT_SECRET" "backend/.env"
  check_env_var "RAZORPAY_KEY_ID" "backend/.env"
  check_env_var "RAZORPAY_KEY_SECRET" "backend/.env"
else
  echo -e "${RED}✗${NC} backend/.env NOT FOUND"
  ((errors++))
fi
echo ""

echo "📋 Checking Frontend Environment..."
echo "------------------------------------"
if [ -f "frontend/college-club-platform/.env.local" ]; then
  echo -e "${GREEN}✓${NC} frontend/college-club-platform/.env.local exists"
  check_env_var "NEXT_PUBLIC_API_URL" "frontend/college-club-platform/.env.local"
else
  echo -e "${RED}✗${NC} frontend/college-club-platform/.env.local NOT FOUND"
  ((errors++))
fi
echo ""

echo "📋 Checking Template Files..."
echo "-----------------------------"
check_file "backend/.env.example"
check_file "frontend/college-club-platform/.env.example"
check_file "ENV_SETUP.md"
echo ""

echo "📋 Checking Git Ignore Configuration..."
echo "--------------------------------------"
if grep -q "\.env" "backend/.gitignore"; then
  echo -e "${GREEN}✓${NC} backend/.env is in .gitignore"
else
  echo -e "${RED}✗${NC} backend/.env is NOT in .gitignore"
  ((errors++))
fi

if grep -q "\.env\.local" "frontend/college-club-platform/.gitignore"; then
  echo -e "${GREEN}✓${NC} frontend/.env.local is in .gitignore"
else
  echo -e "${YELLOW}⚠${NC} frontend/.env.local might not be in .gitignore"
fi
echo ""

# Summary
echo "======================================================"
if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Environment is ready for deployment.${NC}"
  exit 0
else
  echo -e "${RED}✗ $errors error(s) found. Please fix them before deployment.${NC}"
  exit 1
fi
