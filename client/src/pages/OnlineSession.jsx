import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Clock,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import Loader from '../components/Loader';

const OnlineSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [chatMessages, setChatMessages] = useState(0);
  const [attentionTime, setAttentionTime] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);

  useEffect(() => {
    fetchSession();
    trackTabVisibility();
    const timer = setInterval(() => {
      if (joined && document.visibilityState === 'visible') {
        setAttentionTime((prev) => prev + 1);
      }
    }, 60000); // Every minute

    return () => clearInterval(timer);
  }, [id, joined]);

  const fetchSession = async () => {
    try {
      const { data } = await axios.get(`/api/online-sessions/${id}`);
      setSession(data.data.onlineSession);
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackTabVisibility = () => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && joined) {
        setTabSwitches((prev) => prev + 1);
      }
    });
  };

  const handleJoin = async () => {
    try {
      await axios.post(`/api/online-sessions/${id}/join`);
      setJoined(true);
    } catch (error) {
      console.error('Error joining session:', error);
      alert(error.response?.data?.message || 'Failed to join session');
    }
  };

  const handleLeave = async () => {
    try {
      await axios.post(`/api/online-sessions/${id}/leave`);
      navigate('/student');
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const updateEngagement = async () => {
    try {
      const { data } = await axios.post(`/api/online-sessions/${id}/engagement`, {
        cameraStatus: cameraOn ? 'ON' : 'OFF',
        micStatus: micOn ? 'ON' : 'OFF',
        tabSwitches,
        chatMessages,
        attentionTime,
      });
      setEngagementScore(data.data.engagementScore);
    } catch (error) {
      console.error('Error updating engagement:', error);
    }
  };

  useEffect(() => {
    if (joined) {
      const interval = setInterval(updateEngagement, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [joined, cameraOn, micOn, tabSwitches, chatMessages, attentionTime]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navbar />
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Online Session</h1>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                session?.status === 'LIVE'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {session?.status}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Area */}
            <div className="lg:col-span-2">
              <GlassCard className="h-[500px] flex items-center justify-center">
                {!joined ? (
                  <div className="text-center">
                    <Video className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Ready to join the session?
                    </h2>
                    <p className="text-gray-300 mb-6">
                      Platform: {session?.platform}
                      <br />
                      {session?.meetingLink && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:underline"
                        >
                          Open in {session.platform}
                        </a>
                      )}
                    </p>
                    <button
                      onClick={handleJoin}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Join Session
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 bg-black/50 rounded-lg flex items-center justify-center">
                      <p className="text-white text-lg">Video Stream Active</p>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        onClick={() => setCameraOn(!cameraOn)}
                        className={`p-4 rounded-full ${
                          cameraOn ? 'bg-purple-500' : 'bg-red-500'
                        } text-white hover:opacity-80 transition-all`}
                      >
                        {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                      </button>
                      <button
                        onClick={() => setMicOn(!micOn)}
                        className={`p-4 rounded-full ${
                          micOn ? 'bg-purple-500' : 'bg-red-500'
                        } text-white hover:opacity-80 transition-all`}
                      >
                        {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                      </button>
                      <button
                        onClick={handleLeave}
                        className="px-6 py-4 rounded-full bg-red-500 text-white hover:opacity-80 transition-all"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Engagement Score */}
              {joined && (
                <GlassCard>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Engagement Score</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-purple-400 mb-2">
                      {engagementScore}
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${engagementScore}%` }}
                      />
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Stats */}
              {joined && (
                <GlassCard>
                  <h3 className="text-lg font-semibold text-white mb-4">Session Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Camera</span>
                      <span className={cameraOn ? 'text-green-400' : 'text-red-400'}>
                        {cameraOn ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Microphone</span>
                      <span className={micOn ? 'text-green-400' : 'text-red-400'}>
                        {micOn ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Tab Switches</span>
                      <span className="text-white">{tabSwitches}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Attention Time</span>
                      <span className="text-white">{attentionTime} min</span>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Participants */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Participants ({session?.participants?.length || 0})
                  </h3>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {session?.participants?.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                    >
                      <span className="text-white text-sm">
                        {participant.student?.name || 'Student'}
                      </span>
                      <span className="text-green-400 text-xs">Active</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Chat */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Chat</h3>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setChatMessages((prev) => prev + 1);
                        e.target.value = '';
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400">Messages sent: {chatMessages}</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnlineSession;
