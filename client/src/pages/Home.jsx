import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';
import { 
  GraduationCap, 
  QrCode, 
  MapPin, 
  BarChart3, 
  Shield, 
  Zap,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Moon,
  Sun
} from 'lucide-react';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

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

  const features = [
    {
      icon: QrCode,
      title: 'QR Code Attendance',
      description: 'Rotating QR codes every 20 seconds prevent screenshot fraud',
      color: 'indigo'
    },
    {
      icon: MapPin,
      title: 'Geofencing',
      description: 'GPS verification ensures students are physically present on campus',
      color: 'purple'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time insights, trends, and at-risk student detection',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Anti-Fraud System',
      description: 'Location spoofing detection and HMAC-SHA256 security',
      color: 'green'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Socket.IO powered live attendance tracking and notifications',
      color: 'yellow'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Separate dashboards for Admin, Faculty, and Students',
      color: 'pink'
    }
  ];

  const stats = [
    { label: 'Attendance Accuracy', value: '99.9%' },
    { label: 'Time Saved', value: '80%' },
    { label: 'Fraud Prevention', value: '95%' },
    { label: 'User Satisfaction', value: '4.8/5' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
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

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <GraduationCap size={80} className="text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Smart Attendance
              </span>
              <br />
              <span className="text-gray-800 dark:text-white">
                Management System
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionize attendance tracking with QR codes, geofencing, and real-time analytics. 
              Say goodbye to manual roll calls and proxy attendance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight size={20} />
                </motion.button>
              </Link>
              
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Create Account
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <GlassCard className="p-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need for modern, secure, and efficient attendance management
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Faculty Starts Session',
                description: 'Faculty creates a session with optional geofencing and displays a rotating QR code',
                icon: Clock
              },
              {
                step: '2',
                title: 'Students Scan QR',
                description: 'Students scan the QR code with their location verified automatically',
                icon: QrCode
              },
              {
                step: '3',
                title: 'Instant Verification',
                description: 'System verifies location, prevents fraud, and marks attendance in real-time',
                icon: CheckCircle
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <GlassCard className="p-8 text-center h-full">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <item.icon className="mx-auto mb-4 text-indigo-600 dark:text-indigo-400" size={40} />
                  <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Ready to Transform Your Attendance System?
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Join hundreds of institutions using smart attendance management
              </p>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  Get Started Free
                </motion.button>
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
