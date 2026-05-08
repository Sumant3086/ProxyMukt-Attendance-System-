import { Link, useLocation } from 'react-router-dom';
import {
  Home, Calendar, QrCode, BarChart3, Radar, FileText,
  AlertTriangle, Users, BookOpen, Clock, Megaphone,
  Settings, Bell, Target, Trophy, X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const [unreadAlerts] = useState(3);
  const [unreadNotifications] = useState(5);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') closeSidebar(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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
          { path: '/admin/system', icon: Settings, label: 'System Mgmt' },
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

  const NavContent = () => (
    <nav className="p-3 space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
              isActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20'
            }`}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
            )}
            <div className={`relative flex-shrink-0 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`}>
              <Icon size={18} />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="font-medium text-sm flex-1 truncate">{item.label}</span>
            {item.badge > 0 && (
              <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Mobile: backdrop overlay ─────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: slide-in drawer ──────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-50 lg:hidden
          backdrop-blur-xl bg-white/95 dark:bg-gray-800/95
          border-r border-white/20 dark:border-gray-700/50
          shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">Menu</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <NavContent />
      </aside>

      {/* ── Desktop: always-visible sidebar ─────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 border-r border-white/20 dark:border-gray-700/50 min-h-screen sticky top-0 overflow-y-auto">
        <NavContent />
      </aside>
    </>
  );
}
