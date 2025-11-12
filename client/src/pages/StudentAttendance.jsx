import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import GlassCard from '../components/GlassCard';
import AnimatedBackground from '../components/AnimatedBackground';
import ProgressRing from '../components/ProgressRing';
import axiosInstance from '../utils/axiosInstance';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  const fetchData = async () => {
    try {
      const query = selectedClass !== 'all' ? `?classId=${selectedClass}` : '';
      const [attendanceRes, classesRes] = await Promise.all([
        axiosInstance.get(`/attendance/my-attendance${query}`),
        axiosInstance.get('/classes'),
      ]);
      
      setAttendance(attendanceRes.data.data.attendance || []);
      setClasses(classesRes.data.data.classes || []);
      
      // Calculate stats
      if (selectedClass !== 'all') {
        const statsRes = await axiosInstance.get(`/attendance/stats?classId=${selectedClass}`);
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
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
              className="mb-8"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                My Attendance
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Track your attendance records</p>
            </motion.div>

            {/* Class Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <GlassCard className="p-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filter by Class:
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>
              </GlassCard>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              >
                <GlassCard className="p-6 text-center">
                  <ProgressRing percentage={parseFloat(stats.percentage)} size={100} color="blue" />
                  <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Attendance Rate
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <Calendar className="text-blue-500" size={24} />
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Sessions
                    </h3>
                  </div>
                  <p className="text-3xl font-bold">{stats.totalSessions}</p>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="text-green-500" size={24} />
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Attended
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{stats.attendedSessions}</p>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <XCircle className="text-red-500" size={24} />
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Missed
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{stats.missedSessions}</p>
                </GlassCard>
              </motion.div>
            )}

            {/* Attendance Records */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Attendance History
                </h2>

                {attendance.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No attendance records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((record, index) => (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{record.class?.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {record.session?.title || 'Session'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>{new Date(record.markedAt).toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.05, type: 'spring' }}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="text-green-500" size={24} />
                            <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full font-semibold">
                              {record.status}
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
