# College Club Management Platform

A full-stack web application for managing student clubs and their events.

## Project Structure

```
clubManagement/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── controllers/ # API logic
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth, etc.
│   │   └── config/      # Database config
│   └── package.json
└── frontend/
    └── college-club-platform/  # Next.js React app
        ├── app/         # Pages and layouts
        ├── components/  # Reusable UI components
        ├── lib/        # Utilities and API client
        ├── context/    # Auth context
        ├── hooks/      # Custom hooks
        ├── types/      # TypeScript types
        └── package.json
```

## Quick Start

### 1. Set up MongoDB

**Option A: Docker 
```bash
docker-compose up -d
```

**Option B: MongoDB Atlas (Recommended)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a free tier cluster
- Get your connection string
- Update `backend/.env` with `MONGODB_URI`

**Option C: Local MongoDB**
- Install MongoDB Community Edition
- Start: `mongod`

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Start Frontend

```bash
cd frontend/college-club-platform
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

## Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- CORS enabled

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Context API for state management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Clubs
- `GET /api/clubs` - Get all clubs
- `GET /api/clubs/:id` - Get specific club
- `POST /api/clubs` - Create club (admin only)
- `PUT /api/clubs/:id` - Update club
- `DELETE /api/clubs/:id` - Delete club
- `POST /api/clubs/:id/join` - Join club

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get specific event
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/user/registrations` - Get user's registrations

## Features

- ✅ User Authentication (Register/Login with JWT)
- ✅ Admin Dashboard
- ✅ Member Dashboard
- ✅ Club Management
- ✅ Event Management
- ✅ Event Registration
- ✅ Protected Routes
- ✅ Role-based Access Control


### Example Backend Environment Variables
### Backend (`backend/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/club_management
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/college-club-platform/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Development

### Adding new API endpoints
1. Create model in `backend/src/models/`
2. Create controller in `backend/src/controllers/`
3. Add routes in `backend/src/routes/`
4. Add API client methods in `frontend/lib/api.ts`

### Adding new pages
1. Create in `frontend/app/[folder]/page.tsx`
2. Use `useAuth()` hook for authentication
3. Use API client methods to fetch data

## Common Issues

**"MongoDB connection failed"**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

**"API not found"**
- Backend must be running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

**"Token required" error**
- User needs to login first
- Token is stored in localStorage

## Next Steps

- [ ] Add more club features (member management, announcements)
- [ ] Create event details page with registration
- [ ] Add more admin controls
- [ ] Implement email notifications

## Deployment (Render)

This project is ready to deploy to Render (or a similar host). Key points:

- Backend default production URL (example): `https://college-clubs-management-portal-3.onrender.com`
- Frontend default production URL (example): `https://clubmanchh.onrender.com`

Recommended steps to deploy:

1. Create two services on Render (or your host): one for the backend, one for the frontend.

2. Backend environment variables (set these in the Render dashboard, do NOT commit `.env`):

    - `PORT=5000`
    - `MONGODB_URI` = your Atlas connection string (include DB name, do NOT include in git)
    - `JWT_SECRET` = a strong secret
    - `FRONTEND_URL` = https://clubmanchh.onrender.com
    - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (if using payments)

3. Frontend environment variables (set in Render):

    - `NEXT_PUBLIC_API_URL` = https://college-clubs-management-portal-3.onrender.com/api

4. Ensure `.gitignore` excludes `.env` files (this repo already ignores `.env`). Use the provided `.env.example` files as reference.

5. When creating the Render services, point them to the respective folders in this repo:
    - Backend: `backend/` (start command: `npm run build` then `npm start` or `npm run dev` for staging)
    - Frontend: `frontend/college-club-platform/` (start command: `npm run build` then `npm start`)

6. After deploy, test the site by visiting your frontend URL and ensuring API calls are routed to the backend URL.

Security note: rotate any credentials that were exposed in prior commits or messages. Use Render's secret environment settings instead of committing secrets to the repository.

