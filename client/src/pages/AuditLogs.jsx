import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Shield, Filter, Download, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import Loader from '../components/Loader';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const { data } = await axios.get(`/api/audit?${params.toString()}`);
      setLogs(data.data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/audit/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'text-red-500';
    if (action.includes('CREATE')) return 'text-green-500';
    if (action.includes('UPDATE')) return 'text-yellow-500';
    if (action.includes('LOGIN')) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStatusBadge = (status) => {
    const colors = {
      SUCCESS: 'bg-green-500/20 text-green-400',
      FAILED: 'bg-red-500/20 text-red-400',
      WARNING: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-white mb-2">Total Actions</h3>
                  <p className="text-3xl font-bold text-purple-400">
                    {stats.actionStats.reduce((sum, s) => sum + s.count, 0)}
                  </p>
                </GlassCard>
                <GlassCard>
                  <h3 className="text-lg font-semibold text-white mb-2">Failed Actions</h3>
                  <p className="text-3xl font-bold text-red-400">{stats.failedActions}</p>
                </GlassCard>
                <GlassCard>
                  <h3 className="text-lg font-semibold text-white mb-2">Suspicious Activities</h3>
                  <p className="text-3xl font-bold text-yellow-400">
                    {stats.suspiciousActivities.length}
                  </p>
                </GlassCard>
              </div>
            )}

            {/* Filters */}
            <GlassCard className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Filters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="CLASS_CREATE">Class Create</option>
                  <option value="SESSION_START">Session Start</option>
                  <option value="ATTENDANCE_MARK">Attendance Mark</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="WARNING">Warning</option>
                </select>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </GlassCard>

            {/* Logs Table */}
            <GlassCard>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white font-semibold">Time</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">User</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Action</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">IP Address</th>
                      <th className="text-left py-3 px-4 text-white font-semibold">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {log.user?.name || 'Unknown'}
                          <br />
                          <span className="text-xs text-gray-400">{log.user?.email}</span>
                        </td>
                        <td className={`py-3 px-4 font-semibold ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{log.ipAddress}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {log.deviceFingerprint?.substring(0, 8)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Suspicious Activities */}
            {stats?.suspiciousActivities.length > 0 && (
              <GlassCard className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-semibold text-white">Suspicious Activities</h2>
                </div>
                <div className="space-y-3">
                  {stats.suspiciousActivities.map((activity) => (
                    <div
                      key={activity._id}
                      className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold">{activity.user?.name}</p>
                          <p className="text-sm text-gray-400">{activity.action}</p>
                        </div>
                        <span className="text-yellow-400 text-sm">
                          Risk: {activity.details?.deviceRiskScore || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
