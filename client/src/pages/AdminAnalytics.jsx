import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';
import { AttendanceTrendChart, ClassAttendanceChart, RiskDistributionChart, StudentPerformanceChart, StatCard, HeatmapCard } from '../components/AnalyticsCharts';
import { Users, TrendingUp, AlertTriangle, CheckCircle, Download, Shield, Zap, BarChart3 } from 'lucide-react';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dateRange, setDateRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
    fetchAlerts();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/analytics/section?section=all');
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data } = await axiosInstance.get('/alerts?status=PENDING&limit=100');
      setAlerts(data.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
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
      link.setAttribute('download', `admin-report-${new Date().toISOString().split('T')[0]}.csv`);
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
    { name: 'Low Risk', value: Math.floor((alerts.length || 0) * 0.4) },
    { name: 'Medium Risk', value: Math.floor((alerts.length || 0) * 0.3) },
    { name: 'High Risk', value: Math.floor((alerts.length || 0) * 0.2) },
    { name: 'Critical', value: Math.floor((alerts.length || 0) * 0.1) },
  ];

  const performanceData = [
    { range: '90-100%', count: Math.floor((analytics?.students?.length || 0) * 0.3) },
    { range: '75-89%', count: Math.floor((analytics?.students?.length || 0) * 0.4) },
    { range: '60-74%', count: Math.floor((analytics?.students?.length || 0) * 0.2) },
    { range: 'Below 60%', count: analytics?.students?.length || 0 },
  ];

  const heatmapData = Array.from({ length: 35 }, (_, i) => ({
    day: `Day ${i + 1}`,
    value: Math.floor(Math.random() * 100),
  }));

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;

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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Analytics Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">System-wide attendance and security insights</p>
              </div>
              <div className="flex space-x-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
                <button
                  onClick={generateReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download size={18} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              {['overview', 'security', 'performance', 'reports'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    title="Total Sessions"
                    value={analytics?.overview?.totalSessions || 0}
                    color="purple"
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AttendanceTrendChart data={trendData} />
                  <RiskDistributionChart data={riskData} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ClassAttendanceChart data={classData} />
                  <StudentPerformanceChart data={performanceData} />
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    icon={Shield}
                    title="Total Alerts"
                    value={alerts.length}
                    color="blue"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    title="Critical Alerts"
                    value={criticalAlerts}
                    subtitle="Require immediate action"
                    color="red"
                  />
                  <StatCard
                    icon={Zap}
                    title="High Risk"
                    value={highAlerts}
                    subtitle="Under review"
                    color="orange"
                  />
                </div>

                {/* Alert Details */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">Recent Security Alerts</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Risk Score</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Severity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Risk Factors</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {alerts.slice(0, 10).map((alert, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 font-medium">{alert.student?.name}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-red-600">{alert.riskScore}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/20' :
                                alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20' :
                                alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/20'
                              }`}>
                                {alert.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex flex-wrap gap-1">
                                {alert.riskFactors?.slice(0, 2).map((factor, i) => (
                                  <span key={i} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                    {factor}
                                  </span>
                                ))}
                                {alert.riskFactors?.length > 2 && (
                                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                    +{alert.riskFactors.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                alert.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20' :
                                alert.status === 'REVIEWED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20' :
                                'bg-green-100 text-green-800 dark:bg-green-900/20'
                              }`}>
                                {alert.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HeatmapCard title="Attendance Heatmap (5 Weeks)" data={heatmapData} />
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Performance Summary</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Excellent (90-100%)</span>
                          <span className="text-sm font-bold">30%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Good (75-89%)</span>
                          <span className="text-sm font-bold">40%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Fair (60-74%)</span>
                          <span className="text-sm font-bold">20%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Poor (Below 60%)</span>
                          <span className="text-sm font-bold">10%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <StudentPerformanceChart data={performanceData} />
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                      <BarChart3 size={20} />
                      <span>Generate Reports</span>
                    </h3>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left font-medium">
                        📊 Daily Attendance Report
                      </button>
                      <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-left font-medium">
                        🚨 Security Alert Report
                      </button>
                      <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-left font-medium">
                        📈 Performance Report
                      </button>
                      <button className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-left font-medium">
                        👥 Student Analytics Report
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Report Statistics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-sm">Total Reports Generated</span>
                        <span className="font-bold text-lg">247</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-sm">This Month</span>
                        <span className="font-bold text-lg">45</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-sm">This Week</span>
                        <span className="font-bold text-lg">12</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-sm">Last Generated</span>
                        <span className="font-bold text-lg">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">Recent Reports</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Daily Attendance - March 26', date: '2 hours ago', type: 'Attendance' },
                      { name: 'Security Alert Summary - March 26', date: '5 hours ago', type: 'Security' },
                      { name: 'Weekly Performance Report', date: '1 day ago', type: 'Performance' },
                      { name: 'Student Analytics - March 25', date: '2 days ago', type: 'Analytics' },
                    ].map((report, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{report.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 rounded text-xs font-medium">
                            {report.type}
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
