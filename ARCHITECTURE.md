# System Architecture

## Overview

The Automated Student Attendance Monitoring and Analytics System is built using the MERN stack with a modern, scalable architecture.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React + Vite                                         │  │
│  │  - Components (UI)                                    │  │
│  │  - Pages (Routes)                                     │  │
│  │  - Store (Zustand)                                    │  │
│  │  - Utils (Axios, Helpers)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js Server                                    │  │
│  │  - CORS, Helmet, Rate Limiting                       │  │
│  │  - Cookie Parser                                      │  │
│  │  - Error Handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│   REST API Routes    │    │   Socket.IO Server   │
│  - Auth Routes       │    │  - QR Updates        │
│  - Class Routes      │    │  - Real-time Events  │
│  - Session Routes    │    │  - Room Management   │
│  - Attendance Routes │    └──────────────────────┘
└──────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Middleware Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Authentication (JWT)                               │  │
│  │  - Authorization (RBAC)                               │  │
│  │  - Validation                                         │  │
│  │  - Error Handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Auth Controller                                    │  │
│  │  - Class Controller                                   │  │
│  │  - Session Controller                                 │  │
│  │  - Attendance Controller                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - QR Token Generation/Verification                   │  │
│  │  - JWT Token Management                               │  │
│  │  - Business Logic                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Model Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Mongoose Models                                      │  │
│  │  - User Model                                         │  │
│  │  - Class Model                                        │  │
│  │  - Session Model                                      │  │
│  │  - Attendance Model                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MongoDB                                              │  │
│  │  - Collections: users, classes, sessions, attendance │  │
│  │  - Indexes for performance                           │  │
│  │  - Relationships via ObjectId                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── Navbar.jsx           # Top navigation bar
│   ├── Sidebar.jsx          # Side navigation menu
│   ├── QRDisplay.jsx        # QR code display with rotation
│   ├── AttendanceChart.jsx  # Charts for analytics
│   └── Loader.jsx           # Loading spinner
├── pages/
│   ├── Login.jsx            # Login page
│   ├── Register.jsx         # Registration page
│   ├── AdminDashboard.jsx   # Admin dashboard
│   ├── FacultyDashboard.jsx # Faculty dashboard
│   ├── StudentDashboard.jsx # Student dashboard
│   ├── StartSession.jsx     # Live session page
│   └── ScanQR.jsx           # QR scanning page
├── store/
│   ├── authStore.js         # Authentication state
│   └── sessionStore.js      # Session state
└── utils/
    ├── axiosInstance.js     # Axios configuration
    └── utils.js             # Helper functions
```

### Backend Structure

```
src/
├── config/
│   └── db.js                # Database connection
├── models/
│   ├── User.js              # User schema
│   ├── Class.js             # Class schema
│   ├── Session.js           # Session schema
│   └── Attendance.js        # Attendance schema
├── controllers/
│   ├── authController.js    # Auth logic
│   ├── classController.js   # Class logic
│   ├── sessionController.js # Session logic
│   └── attendanceController.js # Attendance logic
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── classRoutes.js       # Class endpoints
│   ├── sessionRoutes.js     # Session endpoints
│   └── attendanceRoutes.js  # Attendance endpoints
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── role.js              # RBAC authorization
│   └── errorHandler.js      # Error handling
├── utils/
│   ├── qr.js                # QR token utilities
│   └── generateToken.js     # JWT utilities
└── server.js                # Main server file
```

## Data Flow

### Authentication Flow

```
1. User submits credentials
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Generate access + refresh tokens
   ↓
5. Set refresh token in httpOnly cookie
   ↓
6. Return access token + user data
   ↓
7. Frontend stores in Zustand + localStorage
   ↓
8. Subsequent requests include Bearer token
```

### QR Attendance Flow

```
1. Faculty starts session
   ↓
2. Backend creates session with LIVE status
   ↓
3. Socket.IO emits QR token every 20s
   ↓
4. Frontend displays QR code
   ↓
5. Student scans QR code
   ↓
6. Frontend sends POST /api/attendance/mark
   ↓
7. Backend verifies QR signature & expiration
   ↓
8. Check session status & student enrollment
   ↓
9. Prevent duplicate attendance
   ↓
10. Create attendance record
   ↓
11. Update session attendance count
   ↓
12. Return success response
```

## Security Architecture

### Authentication Security

- **Access Tokens**: Short-lived (15 min), stored in memory
- **Refresh Tokens**: Long-lived (7 days), httpOnly cookies
- **Password Hashing**: bcrypt with 10 rounds
- **Token Rotation**: New refresh token on each refresh

### API Security

- **Helmet**: Security headers
- **CORS**: Restricted origins
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Mongoose schema validation

### QR Security

- **HMAC Signing**: SHA-256 signature
- **Time-based**: 20-second validity window
- **Session Validation**: Live status check
- **Duplicate Prevention**: Unique constraint

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum['ADMIN', 'FACULTY', 'STUDENT'],
  studentId: String (unique, sparse),
  department: String,
  refreshToken: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Class Collection
```javascript
{
  _id: ObjectId,
  name: String,
  code: String (unique),
  description: String,
  faculty: ObjectId (ref: User),
  department: String,
  semester: String,
  schedule: Array,
  students: [ObjectId] (ref: User),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Session Collection
```javascript
{
  _id: ObjectId,
  class: ObjectId (ref: Class),
  faculty: ObjectId (ref: User),
  title: String,
  date: Date,
  startTime: Date,
  endTime: Date,
  status: Enum['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'],
  location: Object,
  attendanceCount: Number,
  totalStudents: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Collection
```javascript
{
  _id: ObjectId,
  session: ObjectId (ref: Session),
  student: ObjectId (ref: User),
  class: ObjectId (ref: Class),
  status: Enum['PRESENT', 'ABSENT', 'LATE'],
  markedAt: Date,
  qrToken: String,
  deviceInfo: Object,
  location: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- JWT tokens (no server-side sessions)
- Socket.IO with Redis adapter
- Load balancer ready

### Database Scaling
- Indexed queries
- Compound indexes for common queries
- Read replicas for analytics
- Sharding by department/semester

### Caching Strategy
- Redis for session data
- Client-side caching
- API response caching
- Static asset CDN

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer (Nginx)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  App Server  │        │  App Server  │
│  (Node.js)   │        │  (Node.js)   │
└──────────────┘        └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │   MongoDB Cluster    │
        │  (Primary + Replicas)│
        └──────────────────────┘
```

## Technology Justification

### Why MERN Stack?
- **MongoDB**: Flexible schema for evolving requirements
- **Express**: Minimal, fast, unopinionated framework
- **React**: Component-based, efficient rendering
- **Node.js**: JavaScript everywhere, async I/O

### Why Socket.IO?
- Real-time QR updates
- Automatic reconnection
- Room-based broadcasting
- Fallback mechanisms

### Why Zustand?
- Lightweight state management
- Simple API
- No boilerplate
- TypeScript support

### Why TailwindCSS?
- Utility-first approach
- Rapid development
- Consistent design
- Small bundle size
