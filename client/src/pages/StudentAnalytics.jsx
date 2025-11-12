import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import GlassCard from '../components/GlassCard';
import ProgressRing from '../components/ProgressRing';
import axiosInstance from '../utils/axiosInstance';
import { TrendingUp, TrendingDown, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function StudentAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await axiosInstance.get('/analytics/student');
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good':
        return 'text-green-600 dark:text-green-400';
      case 'Warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'At Risk':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Good':
        return <CheckCircle className="text-green-600" size={24} />;
      case 'Warning':
        return <AlertCircle className="text-yellow-600" size={24} />;
      case 'At Risk':
        return <XCircle className="text-red-600" size={24} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Attendance Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track your attendance performance and trends
              </p>
            </div>

            {/* Overall Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <GlassCard className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <ProgressRing 
                      percentage={analytics?.overall.percentage} 
                      size={120}
                      strokeWidth={12}
                    />
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        {analytics?.overall.percentage.toFixed(1)}%
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Overall Attendance
                      </p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(analytics?.overall.status)}
                        <span className={`font-semibold ${getStatusColor(analytics?.overall.status)}`}>
                          {analytics?.overall.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sessions Attended</p>
                      <p className="text-2xl font-bold">
                        {analytics?.overall.totalAttended} / {analytics?.overall.totalSessions}
                      </p>
                    </div>
                    {analytics?.overall.percentage < 75 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                          ⚠️ Below 75% threshold
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Class-wise Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold mb-4">Class-wise Attendance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics?.byClass.map((cls, index) => (
                  <motion.div
                    key={cls.className}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <GlassCard className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{cls.className}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{cls.classCode}</p>
                        </div>
                        <ProgressRing 
                          percentage={parseFloat(cls.percentage)} 
                          size={60}
                          strokeWidth={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Attended</span>
                          <span className="font-medium">{cls.attended} / {cls.totalSessions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Percentage</span>
                          <span className={`font-bold ${
                            cls.percentage >= 75 
                              ? 'text-green-600 dark:text-green-400'
                              : cls.percentage >= 60
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {cls.percentage}%
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Monthly Trend */}
            {analytics?.monthlyTrend.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Calendar className="text-indigo-600" size={24} />
                    <h2 className="text-2xl font-bold">Monthly Trend</h2>
                  </div>
                  <div className="space-y-4">
                    {analytics.monthlyTrend.map((month, index) => {
                      const prevMonth = analytics.monthlyTrend[index - 1];
                      const trend = prevMonth 
                        ? parseFloat(month.percentage) - parseFloat(prevMonth.percentage)
                        : 0;
                      
                      return (
                        <div key={month.month} className="flex items-center space-x-4">
                          <div className="w-24 text-sm font-medium">
                            {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="flex-1">
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${month.percentage}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`h-full rounded-full flex items-center justify-end pr-3 ${
                                  month.percentage >= 75
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                    : month.percentage >= 60
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                    : 'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                              >
                                <span className="text-white text-sm font-bold">
                                  {month.percentage}%
                                </span>
                              </motion.div>
                            </div>
                          </div>
                          <div className="w-32 text-right">
                            <div className="text-sm font-medium">
                              {month.attended}/{month.total}
                            </div>
                            {index > 0 && (
                              <div className={`text-xs flex items-center justify-end space-x-1 ${
                                trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {trend > 0 ? (
                                  <TrendingUp size={14} />
                                ) : trend < 0 ? (
                                  <TrendingDown size={14} />
                                ) : null}
                                <span>{Math.abs(trend).toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Recent Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold mb-6">Recent Sessions</h2>
                <div className="space-y-3">
                  {analytics?.recentSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {session.attended ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : (
                          <XCircle className="text-red-600" size={24} />
                        )}
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(session.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        session.attended
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {session.attended ? 'Present' : 'Absent'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
