import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, QrCode, BarChart3, Radar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { path: '/admin', icon: Home, label: 'Dashboard' },
          { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        ];
      case 'FACULTY':
        return [
          { path: '/faculty', icon: Home, label: 'Dashboard' },
          { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        ];
      case 'STUDENT':
        return [
          { path: '/student', icon: Home, label: 'Dashboard' },
          { path: '/scan', icon: QrCode, label: 'Scan QR' },
          { path: '/auto-attendance', icon: Radar, label: 'Auto-Attendance' },
          { path: '/student/attendance', icon: Calendar, label: 'My Attendance' },
          { path: '/student/analytics', icon: BarChart3, label: 'Analytics' },
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
              <div className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110 group-hover:rotate-12'}`}>
                <Icon size={20} />
              </div>
              
              {/* Label */}
              <span className="font-medium">{item.label}</span>
              
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
