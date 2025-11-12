import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import StatsCard from '../components/StatsCard';
import GlassCard from '../components/GlassCard';
import AnimatedBackground from '../components/AnimatedBackground';
import { AttendanceTrendChart } from '../components/AttendanceChart';
import axiosInstance from '../utils/axiosInstance';
import { QrCode, BookOpen, Calendar, BarChart3, TrendingUp, Award } from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated]);
  
  const fetchData = async () => {
    try {
      const [classesRes, attendanceRes] = await Promise.all([
        axiosInstance.get('/classes'),
        axiosInstance.get('/attendance/my-attendance'),
      ]);
      setClasses(classesRes.data.data.classes || []);
      setAttendance(attendanceRes.data.data.attendance || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-8"
            >
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Student Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Welcome back! Track your attendance</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/scan')}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <QrCode size={20} />
                <span className="font-semibold">Scan QR</span>
              </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                icon={BookOpen}
                title="Enrolled Classes"
                value={classes.length}
                subtitle="Active courses"
                color="blue"
                delay={0}
                trend={5}
              />
              
              <StatsCard
                icon={Calendar}
                title="Total Attendance"
                value={attendance.length}
                subtitle="Sessions attended"
                color="green"
                delay={0.1}
                trend={12}
              />
              
              <StatsCard
                icon={TrendingUp}
                title="Avg Attendance"
                value="85%"
                subtitle="Keep it up!"
                color="orange"
                delay={0.2}
                trend={8}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Classes
                  </h2>
                  <div className="space-y-3">
                    {classes.map((cls, index) => (
                      <motion.div
                        key={cls._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{cls.name}</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{cls.code}</p>
                            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                              👨‍🏫 {cls.faculty?.name}
                            </p>
                          </div>
                          <Award className="text-yellow-500" size={24} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Recent Attendance
                  </h2>
                  <div className="space-y-3">
                    {attendance.slice(0, 5).map((record, index) => (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{record.class?.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              📅 {new Date(record.markedAt).toLocaleString()}
                            </p>
                          </div>
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                            className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-semibold shadow-lg"
                          >
                            ✓ {record.status}
                          </motion.span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
