# 🎓 Automated Student Attendance Monitoring and Analytics System

A comprehensive MERN stack application for automated attendance tracking with **QR codes**, **geofencing**, **real-time analytics**, and **anti-fraud detection**.

## 🌟 Unique Features (Patent-Worthy)

### 1. **Geofencing + Location Verification** 📍
- GPS-based attendance verification
- Prevents proxy attendance from outside campus
- Configurable geofence radius (25m - 500m)
- Anti-spoofing detection for location fraud
- Complete audit trail with coordinates

### 2. **Advanced Analytics & Insights** 📊
- Real-time attendance dashboards
- At-risk student detection (below 75%)
- Monthly trend analysis
- Predictive insights
- CSV export for reports

### 3. **Rotating QR System** 🔄
- QR codes rotate every 20 seconds
- HMAC-SHA256 signature verification
- Prevents screenshot fraud
- Real-time Socket.IO updates

### 4. **Professional UI/UX** 🎨
- Glassmorphism design
- Framer Motion animations
- Dark/Light mode
- Fully responsive
- Accessibility compliant

## 🚀 Tech Stack

### Frontend
- **React 18** + Vite
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time updates
- **Zustand** for state management
- **Axios** for API calls

### Backend
- **Node.js** + Express
- **MongoDB** + Mongoose
- **JWT** authentication
- **Socket.IO** for real-time QR rotation
- **bcrypt** for password hashing
- Security: Helmet, CORS, Rate Limiting

## 📦 Installation

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd attendance-system
```

2. **Backend Setup**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm run dev
```

3. **Frontend Setup**
```bash
cd client
npm install
npm run dev
```

4. **Seed Database** (Optional)
```bash
cd server
node seed.js
```

### Environment Variables

**Server (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLIENT_URL=http://localhost:5173
QR_SECRET=your-qr-secret
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

## 👤 Default Credentials

After seeding the database:

**Owner/Admin:**
- Email: `sumant@college.edu`
- Password: `sumant@2025`
- Role: ADMIN

**Faculty:**
- Email: `faculty@example.com`
- Password: `faculty123`

**Student:**
- Email: `student@example.com`
- Password: `student123`

## 📚 Key Features

### For Faculty
- ✅ Create and manage classes
- ✅ Start live sessions with QR codes
- ✅ Configure geofencing per session
- ✅ View real-time attendance
- ✅ Access analytics dashboard
- ✅ Export attendance reports (CSV)
- ✅ Identify at-risk students

### For Students
- ✅ Scan QR codes to mark attendance
- ✅ Automatic location verification
- ✅ View attendance history
- ✅ Personal analytics dashboard
- ✅ Class-wise performance tracking
- ✅ Monthly trend analysis

### For Admin
- ✅ User management (CRUD)
- ✅ System-wide analytics
- ✅ Class and session oversight
- ✅ Attendance reports
- ✅ At-risk student monitoring

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- HMAC-SHA256 QR code signatures
- Rate limiting on API endpoints
- Helmet.js security headers
- CORS protection
- Location spoofing detection
- Input validation and sanitization

## 📖 Documentation

- **[FEATURES.md](FEATURES.md)** - Complete feature list
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[ANALYTICS_FEATURES.md](ANALYTICS_FEATURES.md)** - Analytics documentation
- **[GEOFENCING_FEATURE.md](GEOFENCING_FEATURE.md)** - Geofencing details
- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Detailed setup guide
- **[SETUP_MONGODB_ATLAS.md](SETUP_MONGODB_ATLAS.md)** - MongoDB Atlas setup
- **[server/API.md](server/API.md)** - API reference

## 🎯 Problem Statement Addressed

This system solves the following problems in college attendance management:

✅ **Manual Roll Calls** - Automated QR-based attendance  
✅ **Proxy Attendance** - Geofencing prevents remote marking  
✅ **Time Wastage** - Instant attendance marking  
✅ **Data Errors** - Digital records with audit trails  
✅ **Lack of Insights** - Advanced analytics and predictions  
✅ **At-Risk Students** - Automatic detection and alerts  
✅ **Report Generation** - One-click CSV exports  

## 🏆 Competitive Advantages

1. **Geofencing** - Unique location verification system
2. **Anti-Spoofing** - Detects fake GPS and mock locations
3. **Real-time Analytics** - Live dashboards and insights
4. **Rotating QR Codes** - Prevents screenshot fraud
5. **Professional UI** - Modern, intuitive interface
6. **Scalable** - Handles thousands of students
7. **Open Source** - Customizable and extensible

## 📱 Screenshots

(Add screenshots of your application here)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Developer

**Sumant Yadav**
- Email: sumant@college.edu
- Phone: +91-XXXXXXXXXX

## 🙏 Acknowledgments

- Problem statement inspired by real college attendance challenges
- Built with modern MERN stack best practices
- Designed for scalability and maintainability

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: sumant@college.edu

---

**Made with ❤️ for educational institutions**
