import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentAttendance from './pages/StudentAttendance';
import AdminDashboard from './pages/AdminDashboard';
import StartSession from './pages/StartSession';
import ScanQR from './pages/ScanQR';
import AutoAttendance from './pages/AutoAttendance';
import Analytics from './pages/Analytics';
import StudentAnalytics from './pages/StudentAnalytics';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  const { user, isAuthenticated } = useAuthStore();
  
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
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
              <Analytics />
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
        
        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
