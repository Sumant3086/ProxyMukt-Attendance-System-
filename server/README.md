# Server - Student Attendance System

Node.js backend API for the attendance management system with MongoDB and real-time features.

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

## Features

- RESTful API with Express
- JWT authentication with refresh tokens
- Real-time QR code generation and rotation
- Geofencing with Haversine formula
- Device fingerprinting and anti-spoofing
- Rate limiting and security middleware
- Comprehensive audit logging
- Role-based access control

## Development

### Prerequisites
- Node.js 18+
- MongoDB 6+

### Setup
```bash
npm install
cp .env.example .env
npm run seed    # Create initial admin user
npm run dev     # Start development server
```

### Environment Variables
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
QR_SECRET=your_qr_secret_here
QR_ROTATION_INTERVAL=20000
CLIENT_URL=http://localhost:5173
```

### Available Scripts
```bash
npm run dev      # Development with auto-reload
npm start        # Production server
npm run seed     # Seed database with admin user
```

## Project Structure

```
src/
├── config/             # Configuration files
│   └── db.js          # MongoDB connection
├── controllers/        # Business logic
│   ├── authController.js
│   ├── classController.js
│   └── ...
├── middleware/         # Express middleware
│   ├── auth.js        # Authentication
│   ├── role.js        # Authorization
│   └── errorHandler.js
├── models/            # MongoDB schemas
│   ├── User.js
│   ├── Class.js
│   ├── Session.js
│   └── Attendance.js
├── routes/            # API endpoints
│   ├── authRoutes.js
│   ├── classRoutes.js
│   └── ...
├── utils/             # Helper functions
│   ├── generateToken.js
│   ├── geofencing.js
│   └── qr.js
└── server.js          # Main server file
```

## API Endpoints

### Authentication
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/refresh     # Token refresh
POST /api/auth/logout      # User logout
GET  /api/auth/profile     # Get user profile
```

### Classes
```
GET    /api/classes        # Get all classes
POST   /api/classes        # Create new class
GET    /api/classes/:id    # Get specific class
PUT    /api/classes/:id    # Update class
DELETE /api/classes/:id    # Delete class
```

### Sessions
```
GET    /api/sessions       # Get sessions
POST   /api/sessions       # Create session
GET    /api/sessions/:id   # Get specific session
PUT    /api/sessions/:id   # Update session
DELETE /api/sessions/:id   # Delete session
```

### Attendance
```
GET  /api/attendance       # Get attendance records
POST /api/attendance/mark  # Mark attendance
GET  /api/attendance/stats # Get attendance statistics
```

## Security Features

### Authentication
- JWT access tokens (15 minutes expiry)
- Refresh tokens (7 days expiry) stored in HTTP-only cookies
- bcrypt password hashing with salt rounds
- Role-based access control (Admin, Faculty, Student)

### QR Code Security
- HMAC-signed tokens with SHA-256
- Time-based rotation (20-second intervals)
- Cryptographic verification to prevent forgery

### Geofencing
- Haversine formula for accurate distance calculation
- Configurable radius per session
- Location spoofing detection
- Device fingerprinting

### API Security
- Rate limiting (500 requests per 15 minutes)
- Helmet.js security headers
- CORS protection
- Input validation and sanitization

## Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['ADMIN', 'FACULTY', 'STUDENT'],
  studentId: String,
  department: String
}
```

### Class
```javascript
{
  name: String,
  code: String (unique),
  faculty: ObjectId (ref: User),
  students: [ObjectId] (ref: User),
  schedule: [{ day, startTime, endTime, room }]
}
```

### Session
```javascript
{
  class: ObjectId (ref: Class),
  faculty: ObjectId (ref: User),
  title: String,
  startTime: Date,
  endTime: Date,
  status: ['SCHEDULED', 'LIVE', 'COMPLETED'],
  location: { latitude, longitude, radius }
}
```

### Attendance
```javascript
{
  session: ObjectId (ref: Session),
  student: ObjectId (ref: User),
  status: ['PRESENT', 'ABSENT', 'LATE'],
  qrToken: String,
  deviceInfo: Object,
  location: Object
}
```

## Real-time Features

Socket.IO handles:
- Live QR code rotation for active sessions
- Real-time attendance notifications
- Session status updates
- Client connection management

## Deployment

```bash
NODE_ENV=production npm start
```

Ensure MongoDB is running and environment variables are properly configured for production.