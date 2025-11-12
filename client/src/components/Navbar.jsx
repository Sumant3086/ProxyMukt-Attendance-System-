import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import VoiceToggle from './VoiceToggle';
import NotificationCenter from './NotificationCenter';
import voiceAnnouncer from '../utils/voiceAnnouncements';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    
    // Welcome announcement
    if (user) {
      voiceAnnouncer.announceWelcome(user.name, user.role);
    }
  }, [user]);
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const handleLogout = async () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 shadow-lg border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Smart Attendance
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <NotificationCenter />
            <VoiceToggle />
            
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
            >
              {darkMode ? (
                <Sun className="text-yellow-500" size={20} />
              ) : (
                <Moon className="text-indigo-600" size={20} />
              )}
            </button>
            
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <User className="text-white" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400">{user?.role}</span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/50"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
