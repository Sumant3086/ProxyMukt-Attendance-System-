import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { LogOut, Moon, Sun, User, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import VoiceToggle from './VoiceToggle';
import NotificationCenter from './NotificationCenter';
import voiceAnnouncer from '../utils/voiceAnnouncements';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
    if (user) voiceAnnouncer.announceWelcome(user.name, user.role);
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 shadow-lg border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-40">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger — only visible on mobile */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={22} className="text-gray-700 dark:text-gray-200" />
            </button>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-sm sm:text-lg">A</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate max-w-[120px] sm:max-w-none">
              Smart Attendance
            </h1>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationCenter />
            {/* Voice toggle hidden on very small screens */}
            <span className="hidden sm:block">
              <VoiceToggle />
            </span>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="text-yellow-500" size={18} />
              ) : (
                <Moon className="text-indigo-600" size={18} />
              )}
            </button>

            {/* User info — hidden on xs, compact on sm */}
            <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <User className="text-white" size={14} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white truncate max-w-[80px] sm:max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 leading-tight">
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-md text-sm font-medium"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
