import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';
import { Users, Calendar, Shield, Search, Trash2, AlertTriangle, CheckCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { CURSOR_PAGE_SIZE } from '../lib/constants';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, classes, analytics, alerts, reports, system, audit
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, totalSessions: 0, totalClasses: 0 });
  const [showConfirm, setShowConfirm] = useState(null);
  const [alertFilter, setAlertFilter] = useState('PENDING');
  const [severityFilter, setSeverityFilter] = useState('');
  
  // Load stats only once on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Load tab data when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'classes') {
      fetchClasses();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'alerts') {
      fetchAlerts();
      fetchVerificationQueue();
    }
  }, [activeTab, cursor, searchTerm, roleFilter, alertFilter, severityFilter]);
  
  const fetchStats = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/dashboard/stats');
      setStats(data.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
      setLoading(true);
      const params = new URLSearchParams({
        status: alertFilter,
        ...(severityFilter && { severity: severityFilter })
      });
      const { data } = await axiosInstance.get(`/alerts?${params}`);
      setAlerts(data.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationQueue = async () => {
    try {
      const { data } = await axiosInstance.get('/alerts/queue/list?status=QUEUED');
      setVerificationQueue(data.data.queue);
    } catch (error) {
      console.error('Error fetching verification queue:', error);
    }
  };
  
  const handleReviewAlert = async (alertId, status, notes) => {
    try {
      await axiosInstance.put(`/alerts/${alertId}/review`, { status, notes });
      fetchAlerts();
      fetchVerificationQueue();
    } catch (error) {
      alert('Error reviewing alert: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: CURSOR_PAGE_SIZE,
        ...(cursor && { cursor }),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });
      
      const { data } = await axiosInstance.get(`/admin/users?${params}`);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: CURSOR_PAGE_SIZE,
        ...(cursor && { cursor }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const { data } = await axiosInstance.get(`/admin/classes?${params}`);
      setClasses(data.data.classes);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await axiosInstance.delete(`/admin/students/${studentId}`);
      setShowConfirm(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Error removing student: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveFaculty = async (facultyId, removeClasses = false) => {
    try {
      await axiosInstance.delete(`/admin/faculty/${facultyId}`, {
        data: { removeClasses }
      });
      setShowConfirm(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Error removing faculty: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveStudentFromClass = async (classId, studentId) => {
    try {
      await axiosInstance.delete(`/admin/classes/${classId}/students/${studentId}`);
      fetchClasses();
    } catch (error) {
      alert('Error removing student: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      await axiosInstance.delete(`/admin/classes/${classId}`);
      setShowConfirm(null);
      fetchClasses();
      fetchStats();
    } catch (error) {
      alert('Error deleting class: ' + (error.response?.data?.message || error.message));
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="text-indigo-600" size={32} />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    System Management & Control
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="text-blue-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="text-purple-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Faculty</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFaculty}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Calendar className="text-orange-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Classes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Calendar className="text-green-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <button
                onClick={() => { setActiveTab('dashboard'); setCursor(null); setSearchTerm(''); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('users'); setCursor(null); setSearchTerm(''); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => { setActiveTab('classes'); setCursor(null); setSearchTerm(''); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'classes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Classes
              </button>
              <button
                onClick={() => { setActiveTab('analytics'); setCursor(null); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => { setActiveTab('alerts'); setCursor(null); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'alerts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <AlertTriangle size={16} />
                  <span>Alerts</span>
                </div>
              </button>
              <button
                onClick={() => { setActiveTab('reports'); setCursor(null); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => { setActiveTab('system'); setCursor(null); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'system'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                System
              </button>
              <button
                onClick={() => { setActiveTab('audit'); setCursor(null); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Audit Logs
              </button>
            </div>
            
            {/* Dashboard Tab - Quick Overview */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-blue-100 text-sm">Total Students</p>
                        <p className="text-3xl font-bold mt-2">{stats.totalStudents}</p>
                      </div>
                      <Users size={32} className="opacity-50" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-purple-100 text-sm">Faculty Members</p>
                        <p className="text-3xl font-bold mt-2">{stats.totalFaculty}</p>
                      </div>
                      <Users size={32} className="opacity-50" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-green-100 text-sm">Active Classes</p>
                        <p className="text-3xl font-bold mt-2">{stats.totalClasses}</p>
                      </div>
                      <Calendar size={32} className="opacity-50" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-orange-100 text-sm">Total Sessions</p>
                        <p className="text-3xl font-bold mt-2">{stats.totalSessions}</p>
                      </div>
                      <Calendar size={32} className="opacity-50" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button onClick={() => setActiveTab('users')} className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                      <Users className="text-blue-600 mb-2" size={24} />
                      <p className="font-medium">Manage Users</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Add/Remove users</p>
                    </button>
                    <button onClick={() => setActiveTab('classes')} className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition">
                      <Calendar className="text-green-600 mb-2" size={24} />
                      <p className="font-medium">Manage Classes</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">View/Edit classes</p>
                    </button>
                    <button onClick={() => setActiveTab('alerts')} className="p-4 border-2 border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      <AlertTriangle className="text-red-600 mb-2" size={24} />
                      <p className="font-medium">Review Alerts</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">High-risk attendance</p>
                    </button>
                    <button onClick={() => setActiveTab('reports')} className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition">
                      <BarChart3 className="text-purple-600 mb-2" size={24} />
                      <p className="font-medium">View Reports</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Generate reports</p>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">System Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Database</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">API Server</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">Running</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cache Service</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">Disabled</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Security Overview</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pending Alerts</span>
                        <span className="text-2xl font-bold text-red-600">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Blocked IPs</span>
                        <span className="text-2xl font-bold text-orange-600">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Rate Limit Hits</span>
                        <span className="text-2xl font-bold text-blue-600">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Users</h2>
                    <div className="flex space-x-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                          className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                      </div>
                      <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      >
                        <option value="">All</option>
                        <option value="STUDENT">Students</option>
                        <option value="FACULTY">Faculty</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader size="md" />
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                user.role === 'FACULTY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm space-x-2">
                              {user.role !== 'ADMIN' && (
                                <button
                                  onClick={() => setShowConfirm({ type: user.role === 'FACULTY' ? 'faculty' : 'student', id: user._id })}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400"
                                  title="Remove user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                {/* Pagination */}
                {pagination && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {pagination.count} of {pagination.totalCount} users
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCursor(null)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          First
                        </button>
                        <button
                          onClick={() => setCursor(pagination.cursor)}
                          disabled={!pagination.hasMore}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Classes</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search classes..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader size="md" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classes.map((cls) => (
                        <div key={cls._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-lg">{cls.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{cls.code} • {cls.department}</p>
                            </div>
                            <button
                              onClick={() => setShowConfirm({ type: 'class', id: cls._id })}
                              className="text-red-600 hover:text-red-800 dark:text-red-400"
                              title="Delete class"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Students</p>
                              <p className="font-bold">{cls.studentCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Sessions</p>
                              <p className="font-bold">{cls.sessionCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Attendance</p>
                              <p className="font-bold">{cls.totalAttendance}</p>
                            </div>
                          </div>
                          {cls.faculty && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Faculty: {cls.faculty.name}
                            </p>
                          )}
                          {cls.students && cls.students.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium mb-2">Students:</p>
                              <div className="space-y-1">
                                {cls.students.slice(0, 3).map((student) => (
                                  <div key={student._id} className="flex justify-between items-center text-xs">
                                    <span>{student.name}</span>
                                    <button
                                      onClick={() => handleRemoveStudentFromClass(cls._id, student._id)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                                {cls.students.length > 3 && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    +{cls.students.length - 3} more
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {pagination.count} of {pagination.totalCount} classes
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCursor(null)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            First
                          </button>
                          <button
                            onClick={() => setCursor(pagination.cursor)}
                            disabled={!pagination.hasMore}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader size="md" />
                  </div>
                ) : analytics ? (
                  <>
                    {/* Overview Section */}
                    {analytics.overview && (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalStudents}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Faculty</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalFaculty}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalSessions}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Live Sessions</p>
                          <p className="text-2xl font-bold text-green-600">{analytics.overview.liveSessions}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Attendance</p>
                          <p className="text-2xl font-bold text-blue-600">{analytics.overview.averageAttendance}%</p>
                        </div>
                      </div>
                    )}

                    {/* Trends Section */}
                    {analytics.trends && analytics.trends.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-lg font-bold mb-4">Daily Attendance Trend (Last 30 Days)</h3>
                        <div className="space-y-2">
                          {analytics.trends.slice(-7).map((trend, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{trend.date}</span>
                              <div className="flex-1 mx-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{width: `${trend.percentage}%`}}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{trend.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* At-Risk Students */}
                    {analytics.students && analytics.students.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                          <AlertTriangle className="text-red-600" size={20} />
                          <span>At-Risk Students (Below 75%)</span>
                        </h3>
                        <div className="space-y-3">
                          {analytics.students.slice(0, 10).map((student, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-600">{student.attendanceRate}%</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{student.present}/{student.total} sessions</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sessions Breakdown */}
                    {analytics.sessions && analytics.sessions.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-lg font-bold mb-4">Recent Sessions</h3>
                        <div className="space-y-2">
                          {analytics.sessions.slice(0, 5).map((session, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{session.title}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{session.class}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{session.attendance}/{session.total}</p>
                                <p className="text-sm text-blue-600">{session.percentage}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
                  </div>
                )}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Alerts List */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">High-Risk Alerts</h2>
                      <div className="flex space-x-2">
                        <select
                          value={alertFilter}
                          onChange={(e) => setAlertFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                        <select
                          value={severityFilter}
                          onChange={(e) => setSeverityFilter(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        >
                          <option value="">All Severity</option>
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <Loader size="sm" />
                        </div>
                      ) : alerts.length > 0 ? (
                        alerts.map((alert) => (
                          <div key={alert._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{alert.student?.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{alert.student?.studentId}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                            <div className="mb-2">
                              <p className="text-sm font-bold text-red-600">Risk Score: {alert.riskScore}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {alert.riskFactors?.join(', ')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              {alert.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleReviewAlert(alert._id, 'APPROVED', 'Approved by admin')}
                                    className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReviewAlert(alert._id, 'REJECTED', 'Rejected by admin')}
                                    className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {alert.status === 'REVIEWED' && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {alert.reviewedBy?.name} reviewed this
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                          <p className="text-gray-600 dark:text-gray-400">No alerts</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Queue */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Queue</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{verificationQueue.length} pending reviews</p>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                      {verificationQueue.length > 0 ? (
                        verificationQueue.map((task) => (
                          <div key={task._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{task.student?.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{task.student?.studentId}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock size={14} className="text-orange-600" />
                                <span className="text-xs font-medium text-orange-600">Priority {task.priority}</span>
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                Risk Score: <span className="font-bold text-red-600">{task.alert?.riskScore}</span>
                              </p>
                            </div>
                            <button
                              onClick={() => handleReviewAlert(task.alert?._id, 'APPROVED', 'Verified')}
                              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Review Now
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                          <p className="text-gray-600 dark:text-gray-400">Queue is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-6">Generate Reports</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left">
                      <BarChart3 className="text-blue-600 mb-3" size={28} />
                      <h3 className="font-bold text-lg mb-1">Daily Attendance Report</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Attendance summary for each day</p>
                    </button>
                    <button className="p-6 border-2 border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left">
                      <AlertTriangle className="text-red-600 mb-3" size={28} />
                      <h3 className="font-bold text-lg mb-1">Security Alert Report</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">High-risk attendance incidents</p>
                    </button>
                    <button className="p-6 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition text-left">
                      <TrendingUp className="text-green-600 mb-3" size={28} />
                      <h3 className="font-bold text-lg mb-1">Performance Report</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Class and student performance metrics</p>
                    </button>
                    <button className="p-6 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-left">
                      <Users className="text-purple-600 mb-3" size={28} />
                      <h3 className="font-bold text-lg mb-1">Student Analytics Report</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Detailed student attendance analysis</p>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">Recent Reports</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">Daily Attendance Report</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Generated 2 hours ago</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Download</button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">Security Alert Report</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Generated 1 day ago</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Download</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">System Health</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Database Performance</span>
                          <span className="text-sm text-green-600">Excellent</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '95%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">API Response Time</span>
                          <span className="text-sm text-green-600">Fast</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '88%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Server Uptime</span>
                          <span className="text-sm text-green-600">99.9%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '99%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Configuration</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Environment</span>
                        <span className="font-medium">Development</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Node Version</span>
                        <span className="font-medium">v22.16.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Database</span>
                        <span className="font-medium">MongoDB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cache</span>
                        <span className="font-medium text-yellow-600">Disabled</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">IP Whitelist Management</h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Add IP to Whitelist
                    </button>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">No IPs whitelisted yet</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">User Login</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">sumant@gmail.com - 2 hours ago</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">LOGIN</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">Alert Reviewed</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">High-risk attendance flagged - 1 day ago</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">REVIEW</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">Class Created</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Data Structures and Algorithms - 3 days ago</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-medium">CREATE</span>
                  </div>
                </div>
              </div>
            )}
            {showConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">Confirm Action</h3>
                  {showConfirm.type === 'student' && (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Are you sure you want to remove this student? They will be removed from all classes and their attendance records will be deleted.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleRemoveStudent(showConfirm.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                  {showConfirm.type === 'faculty' && (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        What would you like to do with this faculty's classes?
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleRemoveFaculty(showConfirm.id, false)}
                          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          Remove Faculty (Keep Classes)
                        </button>
                        <button
                          onClick={() => handleRemoveFaculty(showConfirm.id, true)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Remove Faculty & Delete Classes
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                  {showConfirm.type === 'class' && (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Are you sure you want to delete this class? All sessions and attendance records will be deleted.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDeleteClass(showConfirm.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
