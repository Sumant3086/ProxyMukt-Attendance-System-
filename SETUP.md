# Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure `.env` file with your settings:
```
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
QR_SECRET=your-qr-secret-here
```

5. Seed the database (optional):
```bash
npm run seed
```

6. Start the server:
```bash
npm run dev
```

Server will run on http://localhost:5000

## Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

Client will run on http://localhost:5173

## Default Login Credentials (after seeding)

- **Admin**: admin@example.com / admin123
- **Faculty**: faculty@example.com / faculty123
- **Student**: alice@example.com / student123

## Features Overview

### Faculty
- Create and manage classes
- Start live sessions with rotating QR codes
- View attendance reports
- Track student participation

### Student
- Scan QR codes to mark attendance
- View attendance history
- Check attendance percentage
- Access enrolled classes

### Admin
- View system analytics
- Manage users and classes
- Identify at-risk students
- Generate reports

## Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO for real-time QR updates
- bcrypt for password hashing
- Helmet, CORS for security

### Frontend
- React 18 + Vite
- TailwindCSS for styling
- Zustand for state management
- Recharts for analytics
- Socket.IO client
- Axios for API calls
- QRCode.react for QR generation

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Logout
- GET `/api/auth/profile` - Get user profile

### Classes
- POST `/api/classes` - Create class (Faculty/Admin)
- GET `/api/classes` - Get all classes
- GET `/api/classes/:id` - Get class by ID
- PUT `/api/classes/:id` - Update class
- DELETE `/api/classes/:id` - Delete class (Admin)

### Sessions
- POST `/api/sessions` - Create session
- POST `/api/sessions/:id/start` - Start session
- POST `/api/sessions/:id/end` - End session
- GET `/api/sessions/:id/qr` - Get QR token
- GET `/api/sessions` - Get all sessions
- GET `/api/sessions/:id` - Get session by ID

### Attendance
- POST `/api/attendance/mark` - Mark attendance (Student)
- GET `/api/attendance/my-attendance` - Get student attendance
- GET `/api/attendance/stats` - Get attendance statistics
- GET `/api/attendance/class/:classId/report` - Get class report
- GET `/api/attendance/analytics` - Get analytics (Admin)

## Security Features

- JWT access and refresh tokens
- HttpOnly cookies for refresh tokens
- Password hashing with bcrypt
- HMAC-SHA256 signed QR tokens
- Rate limiting
- CORS protection
- Helmet security headers
- Role-based access control

## QR Code System

- QR tokens rotate every 20 seconds
- Tokens are signed using HMAC-SHA256
- Prevents replay attacks
- Validates session status
- Prevents duplicate attendance

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file

### Port Already in Use
- Change PORT in server/.env
- Change port in client/vite.config.js

### Camera Access Denied
- Allow camera permissions in browser
- Use HTTPS in production

## Production Deployment

1. Build frontend:
```bash
cd client
npm run build
```

2. Set NODE_ENV=production in server/.env

3. Use environment variables for all secrets

4. Enable HTTPS

5. Configure CORS for production domain

6. Use MongoDB Atlas for database

7. Deploy to platforms like:
   - Backend: Heroku, Railway, DigitalOcean
   - Frontend: Vercel, Netlify
   - Database: MongoDB Atlas
