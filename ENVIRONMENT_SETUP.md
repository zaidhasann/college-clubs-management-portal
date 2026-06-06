# 🔧 Environment Setup Guide

Quick reference for setting up environment variables in the College Club Management platform.

## 📁 Files Overview

### Backend (`/backend`)
- **`.env.example`** - Template with all required variables (commit to git)
- **`.env`** - Development configuration (DO NOT commit)
- **`.env.production.example`** - Production template (commit to git)

### Frontend (`/frontend/college-club-platform`)
- **`.env.example`** - Template with all required variables (commit to git)
- **`.env.local`** - Local development configuration (DO NOT commit)
- **`.env.production.example`** - Production template (commit to git)

## 🚀 Quick Start

### For Development

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your local values
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend/college-club-platform
cp .env.example .env.local
# .env.local is already configured for local development
npm install
npm run dev
```

### For Production

**Backend:**
```bash
cp .env.production.example .env.production
# Edit .env.production with production values
NODE_ENV=production npm start
```

**Frontend:**
```bash
cp .env.production.example .env.production.local
# Edit .env.production.local with production API URL
npm run build
npm start
```

## ✅ Validation

Run the environment checker:

**Windows:**
```bash
check-env.bat
```

**Linux/Mac:**
```bash
bash check-env.sh
```

## 📚 Detailed Documentation

See [ENV_SETUP.md](./ENV_SETUP.md) for comprehensive documentation including:
- All environment variables explained
- Service setup (MongoDB, Razorpay)
- Deployment checklists
- Troubleshooting guide
- Security best practices

## 🔐 Environment Variables Summary

| Service | Variable | Where Set | Purpose |
|---------|----------|-----------|---------|
| Backend | PORT | backend/.env | Server port |
| Backend | MONGODB_URI | backend/.env | Database connection |
| Backend | JWT_SECRET | backend/.env | Token signing |
| Backend | RAZORPAY_KEY_ID | backend/.env | Payments |
| Backend | RAZORPAY_KEY_SECRET | backend/.env | Payments |
| Frontend | NEXT_PUBLIC_API_URL | frontend/.env.local | API endpoint |

## 🛠️ Setup Services

### MongoDB
- **Local:** Use default `mongodb://localhost:27017/club_management`
- **Cloud:** Get connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Razorpay
- Get keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
- Test keys: Start with `rzp_test_`
- Live keys: Start with `rzp_live_` (production only)

### JWT Secret
Generate secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ⚠️ Important

- ❌ Never commit `.env` files to git
- ✅ Always commit `.env.example` templates
- 🔒 Keep production secrets secure
- 🔄 Use different secrets for each environment
- 📝 Document any new environment variables

## 🆘 Help

If you encounter any issues:

1. Check `.env.example` for required variables
2. See [ENV_SETUP.md](./ENV_SETUP.md) troubleshooting section
3. Ensure all services are running:
   - MongoDB is accessible
   - Backend is on correct port
   - Frontend can reach backend API

---

**Last updated:** May 2026
