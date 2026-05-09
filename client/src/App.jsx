import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Loader from './components/Loader';
import { startKeepAlive } from './utils/keepAlive';

// Eager load critical pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load dashboard pages (code splitting)
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const FacultyAnalytics = lazy(() => import('./pages/FacultyAnalytics'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const StartSession = lazy(() => import('./pages/StartSession'));
const ScanQR = lazy(() => import('./pages/ScanQR'));
const AutoAttendance = lazy(() => import('./pages/AutoAttendance'));
const StudentAnalytics = lazy(() => import('./pages/StudentAnalytics'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const OnlineSession = lazy(() => import('./pages/OnlineSession'));
const OnlineSessionMonitor = lazy(() => import('./pages/OnlineSessionMonitor'));

// New pages
const Reports = lazy(() => import('./pages/Reports'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Students = lazy(() => import('./pages/Students'));
const Classes = lazy(() => import('./pages/Classes'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));

// Student-specific pages
const StudentPerformance = lazy(() => import('./pages/StudentPerformance'));
const AttendanceGoals = lazy(() => import('./pages/AttendanceGoals'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const Timetable = lazy(() => import('./pages/Timetable'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const QRHistory = lazy(() => import('./pages/QRHistory'));

// Admin-specific pages
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SystemManagement = lazy(() => import('./pages/SystemManagement'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function App() {
  const { user, isAuthenticated } = useAuthStore();
  
  // Start keep-alive service to prevent cold starts
  useEffect(() => {
    if (import.meta.env.PROD) {
      startKeepAlive();
    }
  }, []);
  
  const getDashboard = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    switch (user?.role) {
      case 'ADMIN':
        return <Navigate to="/admin" />;
      case 'FACULTY':
        return <Navigate to="/faculty" />;
      case 'STUDENT':
        return <Navigate to="/student" />;
      default:
        return <Navigate to="/login" />;
    }
  };
  
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? getDashboard() : <Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/session/:id"
          element={
            <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
              <StartSession />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/faculty/analytics"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <FacultyAnalytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student/analytics"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentAnalytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/scan"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ScanQR />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/auto-attendance"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AutoAttendance />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/online-session/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
              <OnlineSession />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/online-session-monitor/:id"
          element={
            <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
              <OnlineSessionMonitor />
            </ProtectedRoute>
          }
        />
        
        {/* Reports Routes */}
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/reports"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        
        {/* Alerts Routes */}
        <Route
          path="/admin/alerts"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/alerts"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Alerts />
            </ProtectedRoute>
          }
        />
        
        {/* Students & Classes Routes (Faculty only) */}
        <Route
          path="/faculty/students"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/classes"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Classes />
            </ProtectedRoute>
          }
        />
        
        {/* Sessions Routes */}
        <Route
          path="/admin/sessions"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Sessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/sessions"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Sessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/sessions"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Sessions />
            </ProtectedRoute>
          }
        />
        
        {/* Announcements Routes */}
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/announcements"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/announcements"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        
        {/* Notifications Routes */}
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/notifications"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        
        {/* Settings Routes */}
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/settings"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/settings"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        
        {/* Student-specific Routes */}
        <Route
          path="/student/performance"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentPerformance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/goals"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AttendanceGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/leave"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Timetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/qr-history"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <QRHistory />
            </ProtectedRoute>
          }
        />
        
        {/* Admin-specific Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SystemManagement />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
