import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, QrCode, BarChart3, Radar, FileText, AlertTriangle, Users, BookOpen, Clock, Megaphone, Settings, Bell, Target, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // TODO: Fetch unread counts from API
  useEffect(() => {
    // Placeholder for fetching unread counts
    setUnreadAlerts(3);
    setUnreadNotifications(5);
  }, []);
  
  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { path: '/admin', icon: Home, label: 'Dashboard' },
          { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/admin/reports', icon: FileText, label: 'Reports' },
          { path: '/admin/alerts', icon: AlertTriangle, label: 'Alerts', badge: unreadAlerts },
          { path: '/admin/users', icon: Users, label: 'User Management' },
          { path: '/admin/system', icon: Settings, label: 'System Management' },
          { path: '/admin/sessions', icon: Clock, label: 'Sessions' },
          { path: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
          { path: '/admin/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
        ];
      case 'FACULTY':
        return [
          { path: '/faculty', icon: Home, label: 'Dashboard' },
          { path: '/faculty/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/faculty/reports', icon: FileText, label: 'Reports' },
          { path: '/faculty/alerts', icon: AlertTriangle, label: 'Alerts', badge: unreadAlerts },
          { path: '/faculty/students', icon: Users, label: 'Students' },
          { path: '/faculty/classes', icon: BookOpen, label: 'Classes' },
          { path: '/faculty/sessions', icon: Clock, label: 'Sessions' },
          { path: '/faculty/announcements', icon: Megaphone, label: 'Announcements' },
          { path: '/faculty/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
          { path: '/faculty/settings', icon: Settings, label: 'Settings' },
        ];
      case 'STUDENT':
        return [
          { path: '/student', icon: Home, label: 'Dashboard' },
          { path: '/scan', icon: QrCode, label: 'Scan QR' },
          { path: '/auto-attendance', icon: Radar, label: 'Auto-Attendance' },
          { path: '/student/attendance', icon: Calendar, label: 'My Attendance' },
          { path: '/student/performance', icon: BarChart3, label: 'Performance' },
          { path: '/student/goals', icon: Target, label: 'Goals & Streaks' },
          { path: '/student/leave', icon: FileText, label: 'Leave/Appeals' },
          { path: '/student/timetable', icon: Calendar, label: 'Timetable' },
          { path: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
          { path: '/student/qr-history', icon: QrCode, label: 'QR History' },
          { path: '/student/sessions', icon: Clock, label: 'Sessions' },
          { path: '/student/announcements', icon: Megaphone, label: 'Announcements' },
          { path: '/student/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
          { path: '/student/settings', icon: Settings, label: 'Settings' },
        ];
      default:
        return [];
    }
  };
  
  const menuItems = getMenuItems();
  
  return (
    <aside className="w-64 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 border-r border-white/20 dark:border-gray-700/50 min-h-screen">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                  : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 hover:scale-105'
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
              )}
              
              {/* Icon with Animation */}
              <div className={`transition-transform duration-300 relative ${isActive ? '' : 'group-hover:scale-110 group-hover:rotate-12'}`}>
                <Icon size={20} />
                {/* Badge for unread counts */}
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className="font-medium flex-1">{item.label}</span>
              
              {/* Badge next to label (alternative position) */}
              {item.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
              
              {/* Hover Shimmer Effect */}
              {!isActive && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
