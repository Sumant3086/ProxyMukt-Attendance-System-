# ProxyMukt Attendance System

> Secure, real-time attendance management with QR codes, geofencing, and advanced fraud detection

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://proxymukt.onrender.com)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-8.0.3-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<img width="1914" height="915" alt="ProxyMukt Application Screenshot" src="https://github.com/user-attachments/assets/86a432fc-eeeb-482e-8a9c-18116a367b68" />

## Tech Stack

**Frontend:** React 18 • Vite • Tailwind CSS • Zustand • Socket.IO Client • Recharts • Framer Motion • Face-API.js

**Backend:** Node.js • Express • MongoDB • Mongoose • Socket.IO • JWT • bcryptjs

**Security:** Helmet • CORS • Rate Limiting • Device Fingerprinting • Geofencing

**Deployment:** Render • MongoDB Atlas

## Features

- **Dynamic QR Code Attendance** – Time-rotated QR codes (20s intervals) with HMAC signing prevent screenshot fraud
- **Geofencing & Location Verification** – Haversine formula validates student location within configurable radius
- **Advanced Fraud Detection** – Device fingerprinting, proxy/VPN detection, residential proxy identification, impossible travel detection
- **Real-time Monitoring** – WebSocket-powered live session tracking, instant attendance updates, admin alert notifications
- **Role-based Dashboards** – Customized interfaces for Admin (8 tabs), Faculty (session management), and Students (attendance history)
- **Comprehensive Analytics** – Attendance trends, at-risk student identification, performance metrics, exportable reports

## Project Structure

- **client/** - React frontend with Vite, Tailwind CSS, and Zustand state management
  - **src/components/** - Reusable UI components (Navbar, Sidebar, Charts, etc.)
  - **src/pages/** - Route pages (Dashboard, Analytics, Session, etc.)
  - **src/store/** - Zustand state management (authStore, sessionStore)
  - **src/utils/** - Utilities (axios, device fingerprint, voice)
  - **src/lib/** - Constants and helper functions

- **server/** - Node.js backend with Express and MongoDB
  - **src/controllers/** - Business logic (auth, attendance, analytics, admin, alerts)
  - **src/models/** - Mongoose schemas (User, Class, Session, Attendance, Alert)
  - **src/routes/** - API endpoints (13 route files)
  - **src/middleware/** - Auth, rate limiting, error handling, audit logging
  - **src/utils/** - QR generation, geofencing, proxy detection, caching
  - **src/services/** - External integrations (Zoom)
  - **seed.js** - Database seeding script (500 students, 50 faculty, 50 classes)

## Prerequisites

- **Node.js** 18.0.0 or higher
- **MongoDB** 6.0 or higher (local or Atlas)
- **npm** 9.0 or higher

## Getting Started

### 1. Clone Repository
Clone the repository and navigate to the project directory.

### 2. Backend Setup
- Navigate to server directory and install dependencies
- Copy `.env.example` to `.env`
- Configure MongoDB URI, JWT secrets, QR secret, and admin credentials in `.env`

### 3. Seed Database
Run the seed script to populate the database with sample data:
- 1 admin user
- 50 faculty members (faculty1@gmail.com / faculty1 through faculty50)
- 500 students (student1@gmail.com / student1 through student500)
- 50 classes with enrolled students
- 414 completed sessions with attendance records

### 4. Frontend Setup
- Navigate to client directory and install dependencies
- Configure `VITE_API_URL` in `.env` file

### 5. Run Development Servers
Start both backend (port 5000) and frontend (port 5173) servers in separate terminals.

### 6. Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Live Demo:** https://proxymukt.onrender.com

**Default Login:**
- Admin: sumant@gmail.com / @Sumant3086
- Faculty: faculty1@gmail.com / faculty1
- Student: student1@gmail.com / student1

## Environment Variables

### Server (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 32 chars) | `pxm_acc_k9#mN2vL$qR8wT5yU3zA1bC6dE0fG4hI7jK` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 32 chars) | `pxm_ref_xW2#nP5qM8vB1cD4eF7gH0iJ3kL6mN9oQ` |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `QR_SECRET` | QR code signing secret | `pxm_qr_zY4#aB7cD0eF3gH6iJ9kL2mN5oP8qR1sT` |
| `QR_ROTATION_INTERVAL` | QR rotation interval (ms) | `20000` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `ADMIN_EMAIL` | Default admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Default admin password | `SecurePassword123` |
| `ZOOM_ACCOUNT_ID` | Zoom account ID (optional) | `your_zoom_account_id` |
| `ZOOM_CLIENT_ID` | Zoom client ID (optional) | `your_zoom_client_id` |
| `ZOOM_CLIENT_SECRET` | Zoom client secret (optional) | `your_zoom_client_secret` |
| `EMAIL_SERVICE` | Email service provider (optional) | `gmail` |
| `EMAIL_USER` | Email username (optional) | `your_email@gmail.com` |
| `EMAIL_PASSWORD` | Email app password (optional) | `your_app_password` |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX_ATTEMPTS` | Max requests per window | `10` |

### Client (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## API Endpoints

### Authentication
- Register new user, login with JWT, refresh tokens, logout, get/update profile

### Classes
- List, create, update, delete classes with student enrollment management

### Sessions
- Create, start, end sessions with QR token generation and attendance tracking

### Attendance
- Mark attendance (rate-limited), check nearby sessions, view history and statistics, generate reports

### Analytics
- Lazy-loaded analytics sections, attendance trends, class/student-specific analytics, CSV export

### Admin
- User management with cursor pagination, dashboard statistics, faculty/student operations, class management

### Alerts
- List and review high-risk attendance alerts, verification queue management, alert statistics

### Zoom Integration
- Create Zoom sessions, sync participants, track attendance from Zoom meetings

### Audit Logs
- Track system activities, user actions, and administrative operations

### Notifications
- Real-time notifications for attendance updates, alerts, and system events

### IP Whitelist
- Manage whitelisted IPs for secure access control

### Appeals
- Students can appeal attendance records, faculty/admin can review and approve

### Online Sessions
- Create and manage online sessions with participant tracking and engagement monitoring

## Scripts

### Server Scripts
- **npm run dev** - Start development server with hot reload
- **npm start** - Start production server
- **npm run seed** - Seed database with sample data (idempotent)
- **npm run build** - Build client and install dependencies

### Client Scripts
- **npm run dev** - Start Vite dev server
- **npm run build** - Build production bundle
- **npm run preview** - Preview production build locally

## Security Features

- **JWT Authentication** – Access/refresh token pair with secure expiry
- **Password Hashing** – bcrypt with salt rounds
- **Rate Limiting** – 500 requests per 15 minutes per IP
- **CORS Protection** – Configured for specific client origin
- **Helmet Middleware** – Security headers (CSP, XSS protection)
- **Device Fingerprinting** – Browser, OS, platform, IP tracking
- **Proxy/VPN Detection** – Identifies datacenter IPs, Tor, residential proxies
- **Geofencing** – Haversine formula validates GPS coordinates
- **QR Code Signing** – HMAC-SHA256 prevents tampering
- **Location Spoofing Detection** – Flags unrealistic accuracy, impossible travel
- **Risk Scoring** – Composite score (0-100) triggers alerts at threshold 70

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

---

**Live Demo:** https://proxymukt.onrender.com  
**Repository:** https://github.com/Sumant3086/ProxyMukt-Attendance-System
