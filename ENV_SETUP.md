# Environment Configuration Guide

This guide explains how to configure environment variables for development, staging, and production deployments.

## Overview

The project uses environment variables to manage configuration across different environments. Each folder has its own set of required variables.

### Files Structure

```
.env.example       # Template with all required variables (tracked in git)
.env               # Development environment (NOT tracked in git)
.env.local         # Local overrides (NOT tracked in git)
.env.production    # Production configuration (NOT tracked in git)
```

---

## Backend Configuration

### Location: `/backend`

### Files

- **`.env.example`** - Template showing all available environment variables
- **`.env`** - Development environment configuration
- **`.env.local`** - Local development overrides (optional)

### Required Variables

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `PORT` | 5000 | Server port | `5000` |
| `NODE_ENV` | development | Environment mode | `development`, `production` |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL for CORS | `http://localhost:3000` |
| `MONGODB_URI` | mongodb://localhost:27017/club_management | Database connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | - | Secret key for JWT tokens | `your-secret-key` |
| `RAZORPAY_KEY_ID` | - | Razorpay API Key ID | `rzp_test_xxxxx` |
| `RAZORPAY_KEY_SECRET` | - | Razorpay API Key Secret | `xxxxx` |

### Setup Instructions

#### Local Development

1. Copy the template file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Update `.env` with your local configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/club_management
   JWT_SECRET=your_dev_secret_key
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   ```

#### Production Deployment

1. Create `.env.production`:
   ```bash
   cd backend
   cp .env.example .env.production
   ```

2. Update with production values:
   ```env
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-domain.com
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/club_management?retryWrites=true&w=majority
   JWT_SECRET=your-production-secret-key
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

3. Deploy with:
   ```bash
   NODE_ENV=production npm start
   ```

---

## Frontend Configuration

### Location: `/frontend/college-club-platform`

### Files

- **`.env.example`** - Template showing all available variables
- **`.env.local`** - Local development configuration
- **`.env.production.local`** - Production configuration (optional)

### Required Variables

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | http://localhost:5000/api | Backend API URL | `http://localhost:5000/api` |

### Setup Instructions

#### Local Development

1. Copy the template file:
   ```bash
   cd frontend/college-club-platform
   cp .env.example .env.local
   ```

2. `.env.local` is already configured for local development:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

#### Production Deployment

1. Create `.env.production.local`:
   ```bash
   cd frontend/college-club-platform
   cp .env.example .env.production.local
   ```

2. Update with production API URL:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```

3. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

---

## Docker Deployment

### Docker Compose Setup

The project includes `docker-compose.yml` for containerized deployment.

#### Set Environment Variables

1. Create `.env` in the project root:
   ```env
   # Backend
   BACKEND_PORT=5000
   MONGODB_URI=mongodb://mongo:27017/club_management
   JWT_SECRET=your-secret-key
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx

   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

---

## Deployment Checklists

### Backend Deployment

- [ ] MongoDB URI is set to production database
- [ ] JWT_SECRET is a strong, random value
- [ ] RAZORPAY keys are production keys (not test keys)
- [ ] FRONTEND_URL is set to production frontend domain
- [ ] PORT is configured for your deployment environment
- [ ] NODE_ENV is set to `production`
- [ ] All sensitive values are in `.env` (NOT in code)

### Frontend Deployment

- [ ] NEXT_PUBLIC_API_URL points to production backend
- [ ] API URL includes `/api` suffix
- [ ] No test/development URLs in configuration
- [ ] Build is optimized (`npm run build`)

---

## Environment Variables by Service

### MongoDB Atlas Setup

Get your MongoDB Atlas connection string:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and database
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
4. Replace in `MONGODB_URI`

### Razorpay Setup

Get Razorpay keys:

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
2. Copy Key ID (for `RAZORPAY_KEY_ID`)
3. Copy Key Secret (for `RAZORPAY_KEY_SECRET`)
4. For testing: Use keys from "Test Mode"
5. For production: Use keys from "Live Mode"

### JWT Secret Generation

Generate a secure JWT secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

---

## Troubleshooting

### Backend Not Connecting to MongoDB

- **Error**: `MongoDB connection failed`
- **Solution**: Verify `MONGODB_URI` is correct and database is accessible

### Frontend Cannot Reach Backend API

- **Error**: `API request failed`
- **Solution**: 
  - Check `NEXT_PUBLIC_API_URL` is correct
  - Ensure backend is running on specified port
  - Verify CORS settings in backend

### JWT Token Issues

- **Error**: `Invalid token` or `Unauthorized`
- **Solution**: Ensure `JWT_SECRET` is the same in frontend and backend

### Payment Gateway Errors

- **Error**: `Razorpay key not found`
- **Solution**: Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct

---

## Security Best Practices

1. **Never commit `.env` files to git**
   - Use `.env.example` as template for developers
   
2. **Use strong secrets**
   - Generate random JWT secrets
   - Never share API keys
   
3. **Rotate secrets regularly**
   - Change JWT secrets periodically
   - Rotate API keys for security
   
4. **Different secrets for each environment**
   - Development, staging, and production should have different keys
   - Never use production keys in development
   
5. **Use environment-specific configurations**
   - `.env.local` for development
   - `.env.production` for production
   - Docker `.env` for containerized deployments

---

## Quick Start

### Development Setup

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd frontend/college-club-platform
cp .env.example .env.local
npm install
npm run dev
```

### Production Deployment

```bash
# Backend
cd backend
cp .env.example .env.production
# Edit .env.production with production values
NODE_ENV=production npm start

# Frontend
cd frontend/college-club-platform
cp .env.example .env.production.local
# Edit .env.production.local with production values
npm run build
npm start
```
