import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../utils/axiosInstance';
import Loader from '../components/Loader';
import AnimatedBackground from '../components/AnimatedBackground';
import GradientText from '../components/GradientText';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { LogIn, Mail, Lock, GraduationCap, Moon, Sun } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data } = await axiosInstance.post('/auth/login', formData);
      setAuth(data.data.user, data.data.accessToken);
      
      // Navigate based on role
      const role = data.data.user.role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'FACULTY') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Dark Mode Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleDarkMode}
        className="fixed top-6 right-6 z-50 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        {darkMode ? (
          <Sun className="text-yellow-500" size={24} />
        ) : (
          <Moon className="text-indigo-600" size={24} />
        )}
      </motion.button>

      {/* Home Link */}
      <Link to="/home">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed top-6 left-6 z-50 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium text-gray-800 dark:text-white"
        >
          ← Home
        </motion.button>
      </Link>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <GraduationCap size={64} className="text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          
          <h2 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Smart Attendance
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            College Management System
          </p>
        </motion.div>
        
        {/* Login Form */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <GlassCard className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800"
                >
                  {error}
                </motion.div>
              )}
              
              <div className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? <Loader size="sm" /> : <LogIn size={20} />}
                <span className="font-semibold">{loading ? 'Signing in...' : 'Sign In'}</span>
              </motion.button>
              
              {/* Register Link */}
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </form>
          </GlassCard>
        </motion.div>
        
        {/* Quick Login Hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-1"
        >
          <p>Available Roles:</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm">
              👑 Owner
            </span>
            <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm">
              👨‍🏫 Faculty
            </span>
            <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm">
              👨‍🎓 Student
            </span>
          </div>
        </motion.div>
      </motion.div>
      
      <Footer />
    </div>
  );
}
