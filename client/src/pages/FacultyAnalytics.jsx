import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';
import { AttendanceTrendChart, ClassAttendanceChart, RiskDistributionChart, StudentPerformanceChart, StatCard } from '../components/AnalyticsCharts';
import { Users, TrendingUp, AlertTriangle, CheckCircle, Download, Filter } from 'lucide-react';

export default function FacultyAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    fetchAnalytics();
    fetchClasses();
  }, [selectedClass, dateRange]);

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
      const params = new URLSearchParams({
        section: 'all',
        ...(selectedClass !== 'all' && { classId: selectedClass }),
      });
      const { data } = await axiosInstance.get(`/analytics/section?${params}`);
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const { data } = await axiosInstance.get('/analytics/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  const trendData = analytics?.trends?.map(t => ({
    date: t.date,
    percentage: t.percentage,
    attendance: t.attendance,
    total: t.total,
  })) || [];

  const classData = analytics?.sessions?.slice(0, 10).map(s => ({
    name: s.class,
    attended: s.attendance,
    absent: s.total - s.attendance,
  })) || [];

  const riskData = [
    { name: 'Low Risk', value: analytics?.overview?.totalSessions || 0 },
    { name: 'Medium Risk', value: Math.floor((analytics?.overview?.totalSessions || 0) * 0.2) },
    { name: 'High Risk', value: Math.floor((analytics?.overview?.totalSessions || 0) * 0.1) },
    { name: 'Critical', value: Math.floor((analytics?.overview?.totalSessions || 0) * 0.05) },
  ];

  const performanceData = [
    { range: '90-100%', count: Math.floor((analytics?.students?.length || 0) * 0.3) },
    { range: '75-89%', count: Math.floor((analytics?.students?.length || 0) * 0.4) },
    { range: '60-74%', count: Math.floor((analytics?.students?.length || 0) * 0.2) },
    { range: 'Below 60%', count: analytics?.students?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Faculty Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive attendance and performance insights</p>
              </div>
              <button
                onClick={generateReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download size={18} />
                <span>Export Report</span>
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="all">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Users}
                title="Total Students"
                value={analytics?.overview?.totalStudents || 0}
                color="blue"
              />
              <StatCard
                icon={TrendingUp}
                title="Average Attendance"
                value={`${analytics?.overview?.averageAttendance || 0}%`}
                color="green"
              />
              <StatCard
                icon={AlertTriangle}
                title="At-Risk Students"
                value={analytics?.students?.length || 0}
                subtitle="Below 75% attendance"
                color="red"
              />
              <StatCard
                icon={CheckCircle}
                title="Live Sessions"
                value={analytics?.overview?.liveSessions || 0}
                color="purple"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <AttendanceTrendChart data={trendData} />
              <RiskDistributionChart data={riskData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ClassAttendanceChart data={classData} />
              <StudentPerformanceChart data={performanceData} />
            </div>

            {/* At-Risk Students Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <AlertTriangle className="text-red-600" size={20} />
                <span>At-Risk Students (Below 75%)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Attendance Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Sessions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics?.students?.slice(0, 10).map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 font-medium">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{student.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  student.attendanceRate >= 75 ? 'bg-green-600' :
                                  student.attendanceRate >= 60 ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }`}
                                style={{ width: `${student.attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className="font-bold">{student.attendanceRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{student.present}/{student.total}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            student.attendanceRate >= 75 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                            student.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                          }`}>
                            {student.attendanceRate >= 75 ? 'Good' : student.attendanceRate >= 60 ? 'Warning' : 'At Risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
