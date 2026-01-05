# Student Attendance System

A modern attendance management system with QR code scanning, geofencing, and real-time analytics for educational institutions.

## Features

- **QR Code Attendance** - Dynamic QR codes with 20-second rotation
- **Geofencing** - Location-based attendance verification
- **Real-time Updates** - Live session monitoring with WebSocket
- **Role Management** - Admin, Faculty, and Student dashboards
- **Analytics** - Comprehensive attendance reports and insights
- **Security** - JWT authentication, device fingerprinting, anti-spoofing

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Zustand  
**Backend:** Node.js, Express, MongoDB, Socket.IO  
**Security:** JWT, bcrypt, Helmet, Rate limiting

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+

### Installation

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd attendance-system

# Server setup
cd server
npm install
cp .env.example .env

# Client setup
cd ../client
npm install
cp .env.example .env
```

2. Configure environment variables in `.env` files

3. Start MongoDB and seed database:
```bash
cd server
npm run seed
```

4. Run the application:
```bash
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Client
cd client
npm run dev
```

5. Access at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Route pages
│   │   ├── store/         # State management
│   │   └── utils/         # Helpers
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Database schemas
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth & validation
│   │   └── utils/         # Helpers
```

## API Endpoints

```
Authentication:
POST /api/auth/login       # User login
POST /api/auth/register    # User registration
GET  /api/auth/profile     # Get profile

Classes:
GET  /api/classes          # List classes
POST /api/classes          # Create class

Sessions:
GET  /api/sessions         # List sessions
POST /api/sessions         # Create session

Attendance:
POST /api/attendance/mark  # Mark attendance
GET  /api/attendance/stats # Get statistics
```

## Configuration

### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
QR_SECRET=your_qr_secret_here
CLIENT_URL=http://localhost:5173
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## User Roles

**Admin:** User management, system analytics, audit logs  
**Faculty:** Class creation, session management, attendance reports  
**Student:** QR scanning, attendance history, personal analytics

## Security Features

- JWT authentication with refresh tokens
- HMAC-signed QR codes with time-based rotation
- Geofencing using Haversine formula
- Device fingerprinting and location spoofing detection
- Rate limiting and CORS protection

## License

MIT License