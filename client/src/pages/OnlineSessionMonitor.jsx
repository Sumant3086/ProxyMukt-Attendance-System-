import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axiosInstance';
import {
  Video,
  Users,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import Loader from '../components/Loader';

const OnlineSessionMonitor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSession();
    
    // Auto-refresh every 10 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchSession, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, autoRefresh]);

  const fetchSession = async () => {
    try {
      const { data } = await axiosInstance.get(`/online-sessions/${id}`);
      setSession(data.data.onlineSession);
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session? Attendance will be processed automatically.')) {
      return;
    }

    try {
      await axiosInstance.post(`/online-sessions/${id}/end`);
      alert('Session ended successfully! Attendance has been processed.');
      navigate('/faculty');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session');
    }
  };

  const getEngagementColor = (score) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEngagementBadge = (score) => {
    if (score >= 75) return 'bg-green-500/20 text-green-400';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const calculateDuration = (joinTime, leaveTime) => {
    const start = new Date(joinTime);
    const end = leaveTime ? new Date(leaveTime) : new Date();
    const diff = Math.floor((end - start) / 60000); // minutes
    return diff;
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'ZOOM':
        return '🎥';
      case 'GOOGLE_MEET':
        return '📹';
      case 'TEAMS':
        return '💼';
      case 'WEBRTC':
        return '🌐';
      default:
        return '📡';
    }
  };

  if (loading) return <Loader />;

  const activeParticipants = session?.participants?.filter(p => !p.leaveTime) || [];
  const leftParticipants = session?.participants?.filter(p => p.leaveTime) || [];
  const averageEngagement = session?.participants?.length > 0
    ? Math.round(
        session.participants.reduce((sum, p) => sum + (p.engagementScore || 0), 0) /
          session.participants.length
      )
    : 0;

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
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl"
                  >
                    {getPlatformIcon(session?.platform)}
                  </motion.div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Online Session Monitor</h1>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-300">
                        Platform: <span className="font-semibold text-white">{session?.platform}</span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            session?.status === 'LIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                          }`}
                        />
                        <span
                          className={`font-semibold ${
                            session?.status === 'LIVE' ? 'text-green-400' : 'text-gray-400'
                          }`}
                        >
                          {session?.status}
                        </span>
                      </div>
                      {session?.isRecording && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                            <motion.div
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-2 h-2 bg-red-500 rounded-full"
                            />
                            <span className="text-red-400 text-sm font-semibold">RECORDING</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      autoRefresh
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                    }`}
                  >
                    {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
                  </motion.button>
                  {session?.meetingLink && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-lg font-semibold hover:bg-blue-500/30 transition-all"
                    >
                      <ExternalLink size={18} />
                      Open Meeting
                    </motion.a>
                  )}
                  {session?.status === 'LIVE' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEndSession}
                      className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      End Session
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlassCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Active Now</p>
                      <motion.p
                        key={activeParticipants.length}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-5xl font-bold text-white mt-2"
                      >
                        {activeParticipants.length}
                      </motion.p>
                      <p className="text-green-400 text-xs mt-1">🟢 Live participants</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Users className="w-14 h-14 text-green-400" />
                    </motion.div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Total Joined</p>
                      <p className="text-5xl font-bold text-white mt-2">
                        {session?.participants?.length || 0}
                      </p>
                      <p className="text-blue-400 text-xs mt-1">📊 All time</p>
                    </div>
                    <CheckCircle className="w-14 h-14 text-blue-400" />
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Avg Engagement</p>
                      <p className={`text-5xl font-bold mt-2 ${getEngagementColor(averageEngagement)}`}>
                        {averageEngagement}%
                      </p>
                      <p className={`text-xs mt-1 ${getEngagementColor(averageEngagement)}`}>
                        {averageEngagement >= 75 ? '🎯 Excellent' : averageEngagement >= 50 ? '⚠️ Fair' : '❌ Poor'}
                      </p>
                    </div>
                    <TrendingUp className="w-14 h-14 text-purple-400" />
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Duration</p>
                      <p className="text-5xl font-bold text-white mt-2">
                        {session?.duration || 0}m
                      </p>
                      <p className="text-orange-400 text-xs mt-1">⏱️ Session time</p>
                    </div>
                    <Clock className="w-14 h-14 text-orange-400" />
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* Active Participants */}
            <GlassCard className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-3 h-3 bg-green-500 rounded-full"
                  />
                  <h2 className="text-2xl font-bold text-white">
                    Active Participants ({activeParticipants.length})
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {session?.status === 'LIVE' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        // Toggle recording
                        alert('Recording feature coming soon!');
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        session?.isRecording
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                      }`}
                    >
                      <Video size={18} />
                      {session?.isRecording ? 'Stop Recording' : 'Start Recording'}
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white font-semibold">Student</th>
                      <th className="text-center py-3 px-4 text-white font-semibold">Camera</th>
                      <th className="text-center py-3 px-4 text-white font-semibold">Mic</th>
                      <th className="text-center py-3 px-4 text-white font-semibold">Duration</th>
                      <th className="text-center py-3 px-4 text-white font-semibold">Tab Switches</th>
                      <th className="text-center py-3 px-4 text-white font-semibold">Engagement</th>
                      <th className="text-center py-3 px-4 text-white font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeParticipants.map((participant, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-semibold">
                              {participant.student?.name || 'Unknown'}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {participant.student?.email || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {participant.cameraStatus === 'ON' ? (
                            <Camera className="w-5 h-5 text-green-400 mx-auto" />
                          ) : (
                            <CameraOff className="w-5 h-5 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {participant.micStatus === 'ON' ? (
                            <Mic className="w-5 h-5 text-green-400 mx-auto" />
                          ) : (
                            <MicOff className="w-5 h-5 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-white">
                          {calculateDuration(participant.joinTime, participant.leaveTime)} min
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              participant.tabSwitches > 10
                                ? 'bg-red-500/20 text-red-400'
                                : participant.tabSwitches > 5
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {participant.tabSwitches || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getEngagementBadge(
                              participant.engagementScore || 0
                            )}`}
                          >
                            {participant.engagementScore || 0}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                            🟢 ACTIVE
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {activeParticipants.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No active participants</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Left Participants */}
            {leftParticipants.length > 0 && (
              <GlassCard>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <h2 className="text-2xl font-bold text-white">
                    Left Participants ({leftParticipants.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white font-semibold">Student</th>
                        <th className="text-center py-3 px-4 text-white font-semibold">
                          Join Time
                        </th>
                        <th className="text-center py-3 px-4 text-white font-semibold">
                          Leave Time
                        </th>
                        <th className="text-center py-3 px-4 text-white font-semibold">Duration</th>
                        <th className="text-center py-3 px-4 text-white font-semibold">
                          Engagement
                        </th>
                        <th className="text-center py-3 px-4 text-white font-semibold">
                          Attendance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leftParticipants.map((participant, index) => {
                        const duration = participant.duration || 0;
                        const requiredDuration = (session?.duration || 60) * 0.75;
                        const willBePresent = duration >= requiredDuration;

                        return (
                          <tr
                            key={index}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-white font-semibold">
                                  {participant.student?.name || 'Unknown'}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {participant.student?.email || 'N/A'}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center text-gray-300 text-sm">
                              {new Date(participant.joinTime).toLocaleTimeString()}
                            </td>
                            <td className="py-4 px-4 text-center text-gray-300 text-sm">
                              {new Date(participant.leaveTime).toLocaleTimeString()}
                            </td>
                            <td className="py-4 px-4 text-center text-white">{duration} min</td>
                            <td className="py-4 px-4 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${getEngagementBadge(
                                  participant.engagementScore || 0
                                )}`}
                              >
                                {participant.engagementScore || 0}%
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  willBePresent
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {willBePresent ? '✓ PRESENT' : '✗ ABSENT'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {/* Enhanced Engagement Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Engagement Insights</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Camera className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="text-white font-semibold">Camera Usage</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-white">
                        {session?.participants?.filter((p) => p.cameraStatus === 'ON').length || 0}
                      </p>
                      <p className="text-2xl text-gray-400">/</p>
                      <p className="text-2xl text-gray-400">{session?.participants?.length || 0}</p>
                    </div>
                    <p className="text-green-400 text-sm mt-2 font-medium">
                      {session?.participants?.length > 0
                        ? `${Math.round(
                            ((session?.participants?.filter((p) => p.cameraStatus === 'ON').length || 0) /
                              session?.participants?.length) *
                              100
                          )}% with camera on`
                        : 'No participants yet'}
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                      </div>
                      <h3 className="text-white font-semibold">Distracted</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">
                      {session?.participants?.filter((p) => p.tabSwitches > 10).length || 0}
                    </p>
                    <p className="text-yellow-400 text-sm mt-2 font-medium">
                      Students with &gt;10 tab switches
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold">High Engagement</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">
                      {session?.participants?.filter((p) => p.engagementScore >= 75).length || 0}
                    </p>
                    <p className="text-purple-400 text-sm mt-2 font-medium">
                      Students with ≥75% engagement
                    </p>
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OnlineSessionMonitor;
