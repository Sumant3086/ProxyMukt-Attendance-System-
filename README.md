# 🎓 ProxyMukt Smart Attendance System

A comprehensive, fraud-proof attendance management system with multi-layer security, real-time updates, and advanced analytics.

## 🌟 Features

### 🔐 Multi-Layer Security
- **QR Code Authentication**: Rotating QR codes every 20 seconds to prevent screenshot fraud
- **Face Liveness Detection**: Real-time movement check (not facial recognition)
- **GPS Geofencing**: Location-based verification with configurable radius
- **Device Fingerprinting**: Tracks unique device signatures
- **Proxy/VPN Detection**: Advanced detection of location spoofing
- **IP Reputation Analysis**: Datacenter and suspicious IP detection
- **Impossible Travel Detection**: Validates location consistency over time

### 👥 Role-Based Access Control
- **Admin Dashboard**: System-wide management, analytics, and security monitoring
- **Faculty Dashboard**: Class management, session control, and attendance tracking
- **Student Dashboard**: QR scanning, attendance history, and analytics

### 📊 Real-Time Features
- **WebSocket Integration**: Live attendance updates and QR code rotation
- **Instant Notifications**: Real-time alerts for faculty and students
- **Live Session Monitoring**: Track attendance as it happens

### 🎯 Faculty Controls
- **Flexible Verification**: Toggle QR, Face Liveness, and Geofencing per session
- **Session Types**: Support for both Offline (QR) and Online (Zoom/Meet/Teams) classes
- **Dynamic QR Control**: Enable/disable QR code generation anytime during session
- **Verification Settings**: Configure requirements on-the-fly with real-time updates

### 📈 Advanced Analytics
- **Attendance Trends**: Visual charts and heatmaps
- **Risk Detection**: Identify at-risk students based on attendance patterns
- **Class Performance**: Comprehensive analytics for faculty and admin
- **Audit Logs**: Complete trail of all system activities

## 🚀 Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Socket.IO Client** for real-time updates
- **Recharts** for data visualization
- **jsQR** for QR code scanning

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for WebSocket communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **HMAC-SHA256** for QR token security

### Security & Performance
- **Helmet.js** for security headers
- **Express Rate Limit** for DDoS protection
- **Circuit Breaker Pattern** for fault tolerance
- **Response Optimization** with ETag and compression
- **Input Sanitization** to prevent XSS and injection attacks

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+
- Git

### Clone Repository
```bash
git clone https://github.com/Sumant3086/ProxyMukt-Attendance-System-.git
cd ProxyMukt-Attendance-System-
```

### Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your MongoDB URI, JWT secret, etc.

# Seed database (optional)
npm run seed

# Start server
npm start
```

### Frontend Setup
```bash
cd client
npm install

# Create .env file
cp .env.example .env

# Configure API URL
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Optional: Zoom Integration
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret

# Optional: Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎯 Usage

### Default Accounts (After Seeding)
```
Admin:
Email: admin@college.edu
Password: admin123

Faculty:
Email: faculty@college.edu
Password: faculty123

Student:
Email: student@college.edu
Password: student123
```

### Faculty Workflow
1. **Create Class**: Add class with name, code, and department
2. **Start Session**: Choose session type (Offline/Online)
3. **Configure Verification**: Toggle QR, Face Liveness, Geofencing
4. **Monitor Attendance**: View real-time attendance updates
5. **End Session**: Close session and review analytics

### Student Workflow
1. **Scan QR Code**: Use camera to scan faculty's QR code
2. **Face Verification**: Complete liveness check (if required)
3. **Location Verification**: Confirm you're at session location (if required)
4. **Attendance Marked**: Receive confirmation and view history

## 🏗️ Project Structure

```
ProxyMukt-Attendance-System/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Server entry point
│   └── package.json
│
├── render.yaml            # Render deployment config
└── README.md
```

## 🔒 Security Features

### QR Code Security
- **HMAC-SHA256 Signing**: Cryptographically signed tokens
- **Time-Based Expiry**: 100-second validity window
- **Rotation**: New QR every 20 seconds
- **Session Binding**: QR tied to specific session

### Fraud Prevention
- **Device Fingerprinting**: Browser, OS, screen resolution tracking
- **Proxy Detection**: VPN, datacenter, and proxy IP detection
- **Location Spoofing**: GPS accuracy and consistency checks
- **Impossible Travel**: Validates location changes over time
- **Rate Limiting**: Prevents brute force and DDoS attacks

### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Sanitization**: XSS and injection prevention
- **CORS Protection**: Restricted cross-origin requests
- **Security Headers**: Helmet.js implementation

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # Login user
GET    /api/auth/me           # Get current user
POST   /api/auth/logout       # Logout user
```

### Sessions
```
GET    /api/sessions          # Get all sessions
POST   /api/sessions          # Create session
GET    /api/sessions/:id      # Get session by ID
POST   /api/sessions/:id/start    # Start session
POST   /api/sessions/:id/end      # End session
PATCH  /api/sessions/:id/toggle-qr    # Toggle QR
PATCH  /api/sessions/:id/verification-settings    # Update verification
GET    /api/sessions/:id/qr   # Get QR token
```

### Attendance
```
POST   /api/attendance/mark   # Mark attendance
GET    /api/attendance/my-attendance    # Get student attendance
GET    /api/attendance/session/:id      # Get session attendance
```

### Analytics
```
GET    /api/analytics/section?section=all    # Get analytics
GET    /api/analytics/student/:id            # Student analytics
GET    /api/analytics/class/:id              # Class analytics
```

## 🚀 Deployment

### Render.com (Recommended)
1. Push code to GitHub
2. Connect repository to Render
3. Configure environment variables
4. Deploy automatically on push

### Manual Deployment
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
NODE_ENV=production npm start
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Sumant Kumar**
- GitHub: [@Sumant3086](https://github.com/Sumant3086)

## 🙏 Acknowledgments

- QR Code generation using crypto HMAC
- Face detection using TensorFlow.js
- Real-time updates with Socket.IO
- UI components inspired by modern design systems

## 📞 Support

For support, email sumantyadav3086@gmail.com or open an issue on GitHub.

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Multi-layer fraud detection
- ✅ Real-time WebSocket updates
- ✅ Faculty-controlled verification
- ✅ Advanced analytics dashboard
- ✅ Dark theme UI
- ✅ Production deployment ready

### v1.0.0
- Initial release with basic QR attendance

---

Made with ❤️ for educational institutions
