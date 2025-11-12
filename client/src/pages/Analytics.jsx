import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import GlassCard from '../components/GlassCard';
import axiosInstance from '../utils/axiosInstance';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  AlertTriangle,
  Download,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchAnalytics();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await axiosInstance.get('/classes');
      setClasses(data.data.classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const { data } = await axiosInstance.get(`/analytics/attendance?${params}`);
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await axiosInstance.get(`/analytics/export/csv?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleFilter = () => {
    fetchAnalytics();
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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Attendance Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Comprehensive insights and attendance patterns
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Download size={20} />
                <span>Export CSV</span>
              </motion.button>
            </div>

            {/* Filters */}
            <GlassCard className="mb-8 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFilter}
                    className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Apply Filters
                  </motion.button>
                </div>
              </div>
            </GlassCard>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                      <p className="text-3xl font-bold mt-2">{analytics?.overview.totalSessions}</p>
                    </div>
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <Calendar className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Attendance</p>
                      <p className="text-3xl font-bold mt-2">{analytics?.overview.averageAttendance}%</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      {analytics?.overview.averageAttendance >= 75 ? (
                        <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                      ) : (
                        <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Live Sessions</p>
                      <p className="text-3xl font-bold mt-2">{analytics?.overview.liveSessions}</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <BarChart3 className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">At-Risk Students</p>
                      <p className="text-3xl font-bold mt-2">{analytics?.atRiskStudents.length}</p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* At-Risk Students */}
            {analytics?.atRiskStudents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <AlertTriangle className="text-red-600" size={24} />
                    <h2 className="text-2xl font-bold">At-Risk Students (Below 75%)</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Student ID</th>
                          <th className="text-center py-3 px-4">Present</th>
                          <th className="text-center py-3 px-4">Total</th>
                          <th className="text-center py-3 px-4">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.atRiskStudents.map((student, index) => (
                          <motion.tr
                            key={student._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="py-3 px-4">{student.name}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{student.email}</td>
                            <td className="py-3 px-4">{student.studentId || 'N/A'}</td>
                            <td className="py-3 px-4 text-center">{student.present}</td>
                            <td className="py-3 px-4 text-center">{student.total}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                student.attendanceRate >= 60
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {student.attendanceRate}%
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Daily Trend Chart */}
            {analytics?.dailyTrend.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <PieChart className="text-indigo-600" size={24} />
                    <h2 className="text-2xl font-bold">Attendance Trend (Last 30 Days)</h2>
                  </div>
                  <div className="space-y-4">
                    {analytics.dailyTrend.slice(-10).map((day, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-32 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(day.date).toLocaleDateString()}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${day.percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className={`h-full rounded-full ${
                                day.percentage >= 75
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : day.percentage >= 60
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : 'bg-gradient-to-r from-red-500 to-pink-500'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="w-24 text-right font-medium">
                          {day.attendance}/{day.total} ({day.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Session Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Users className="text-indigo-600" size={24} />
                  <h2 className="text-2xl font-bold">Session Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4">Title</th>
                        <th className="text-left py-3 px-4">Class</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-center py-3 px-4">Attendance</th>
                        <th className="text-center py-3 px-4">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.sessionBreakdown.slice(0, 10).map((session, index) => (
                        <motion.tr
                          key={session.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4 font-medium">{session.title}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{session.class}</td>
                          <td className="py-3 px-4">{new Date(session.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">{session.attendance}/{session.total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              session.percentage >= 75
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : session.percentage >= 60
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {session.percentage}%
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
