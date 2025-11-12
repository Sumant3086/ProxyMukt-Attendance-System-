import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import StatsCard from '../components/StatsCard';
import GlassCard from '../components/GlassCard';
import AnimatedBackground from '../components/AnimatedBackground';
import { AttendanceTrendChart, AttendanceBarChart } from '../components/AttendanceChart';
import axiosInstance from '../utils/axiosInstance';
import { Users, BookOpen, Calendar, AlertTriangle, TrendingUp, Activity, Shield, Award } from 'lucide-react';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAnalytics();
  }, []);
  
  const fetchAnalytics = async () => {
    try {
      const { data } = await axiosInstance.get('/attendance/analytics');
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="text-indigo-600 dark:text-indigo-400" size={40} />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    System Overview & Analytics
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                icon={Users}
                title="Total Students"
                value={analytics?.overview.totalStudents || 0}
                subtitle="Registered users"
                color="blue"
                delay={0}
                trend={15}
              />

              
              <StatsCard
                icon={BookOpen}
                title="Total Classes"
                value={analytics?.overview.totalClasses || 0}
                subtitle="Active courses"
                color="green"
                delay={0.1}
                trend={8}
              />
              
              <StatsCard
                icon={Calendar}
                title="Total Sessions"
                value={analytics?.overview.totalSessions || 0}
                subtitle="Conducted sessions"
                color="orange"
                delay={0.2}
                trend={22}
              />
              
              <StatsCard
                icon={AlertTriangle}
                title="At-Risk Students"
                value={analytics?.atRiskStudents?.length || 0}
                subtitle="Below 75% attendance"
                color="red"
                delay={0.3}
              />
            </div>
            
            {/* System Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  System Health
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <Activity className="text-green-600" size={24} />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">System Status</p>
                      <p className="text-lg font-bold text-green-600">Operational</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <TrendingUp className="text-indigo-600" size={24} />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Avg Attendance</p>
                      <p className="text-lg font-bold text-indigo-600">87.5%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <Award className="text-orange-600" size={24} />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
                      <p className="text-lg font-bold text-orange-600">{(analytics?.overview.totalStudents || 0) + 10}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* At-Risk Students */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  At-Risk Students (&lt; 75% Attendance)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-600 dark:text-slate-400">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-600 dark:text-slate-400">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-600 dark:text-slate-400">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-600 dark:text-slate-400">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {analytics?.atRiskStudents?.length > 0 ? (
                        analytics.atRiskStudents.map((item, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium">{item.student.name}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.student.email}</td>
                            <td className="px-6 py-4">{item.class.name}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-semibold">
                                {item.percentage}%
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                            <Award size={48} className="mx-auto mb-2 text-green-500" />
                            <p>Great! No students at risk.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
