import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
const Analytics = lazy(() => import('./pages/Analytics'));
const StudentAnalytics = lazy(() => import('./pages/StudentAnalytics'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const OnlineSession = lazy(() => import('./pages/OnlineSession'));
const OnlineSessionMonitor = lazy(() => import('./pages/OnlineSessionMonitor'));

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
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
        
        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
