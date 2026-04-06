import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import QRDisplay from '../components/QRDisplay';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';
import { Users, Clock, StopCircle, Settings, CheckCircle, XCircle, QrCode, Zap, Lock, MapPin } from 'lucide-react';

export default function StartSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [qrEnabled, setQrEnabled] = useState(false);
  const [verificationSettings, setVerificationSettings] = useState({
    qrCode: true,
    faceVerification: false,
    locationVerification: false,
    facialRecognition: false, // Future
    fingerprintVerification: false, // Future
  });
  
  useEffect(() => {
    fetchSession();
    
    // Get auth data for WebSocket authentication
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authData.state?.user?._id;
    const role = authData.state?.user?.role;
    
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        userId,
        role
      }
    });
    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        newSocket.emit('leave-session', id);
        newSocket.disconnect();
      }
    };
  }, [id]);
  
  useEffect(() => {
    if (socket && session?.status === 'LIVE') {
      socket.emit('join-session', id);
      
      socket.on('qr-update', (data) => {
        setQrToken(data.qrToken);
      });
      
      // Listen for real-time attendance updates
      socket.on('attendance-marked', (data) => {
        console.log('Attendance marked:', data);
        setSession(prev => ({
          ...prev,
          attendanceCount: data.attendanceCount || (prev.attendanceCount + 1)
        }));
      });
      
      // Listen for class attendance updates
      socket.on('class-attendance-update', (data) => {
        console.log('Class attendance update:', data);
        // Refresh session data
        fetchSession();
      });
      
      return () => {
        socket.off('qr-update');
        socket.off('attendance-marked');
        socket.off('class-attendance-update');
      };
    }
  }, [socket, session, id]);
  
  const fetchSession = async () => {
    try {
      const { data } = await axiosInstance.get(`/sessions/${id}`);
      setSession(data.data.session);
      setQrEnabled(data.data.session.qrEnabled || false);
      
      // Set verification settings from session
      if (data.data.session.verificationRequirements) {
        setVerificationSettings(data.data.session.verificationRequirements);
      }
      
      if (data.data.session.status !== 'LIVE') {
        try {
          await axiosInstance.post(`/sessions/${id}/start`);
          const updated = await axiosInstance.get(`/sessions/${id}`);
          setSession(updated.data.data.session);
          setQrEnabled(updated.data.data.session.qrEnabled || false);
          if (updated.data.data.session.verificationRequirements) {
            setVerificationSettings(updated.data.data.session.verificationRequirements);
          }
        } catch (startError) {
          // If session is already live, just continue
          if (startError.response?.status === 400) {
            console.log('Session already live, continuing...');
          } else {
            throw startError;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      if (error.response?.status === 404) {
        alert('Session not found. Redirecting to dashboard...');
        navigate('/faculty');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleQR = async () => {
    try {
      const newQrState = !qrEnabled;
      await axiosInstance.patch(`/sessions/${id}/toggle-qr`, {
        qrEnabled: newQrState
      });
      setQrEnabled(newQrState);
      if (newQrState) {
        // Generate new QR token
        const { data } = await axiosInstance.get(`/sessions/${id}/qr`);
        setQrToken(data.data.qrToken);
      }
    } catch (error) {
      console.error('Error toggling QR:', error);
      alert('Failed to toggle QR code');
    }
  };

  const updateVerificationSettings = async (newSettings) => {
    try {
      await axiosInstance.patch(`/sessions/${id}/verification-settings`, {
        verificationRequirements: newSettings
      });
      setVerificationSettings(newSettings);
      alert('Verification settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  const handleEndSession = async () => {
    try {
      await axiosInstance.post(`/sessions/${id}/end`);
      navigate('/faculty');
    } catch (error) {
      console.error('Error ending session:', error);
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
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                  {session?.title}
                </h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {session?.class?.name}
                </p>
              </div>
              <button
                onClick={handleEndSession}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold"
              >
                <StopCircle size={20} />
                <span>End Session</span>
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Attendance Card */}
              <div className="bg-[#1a1f35] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Attendance</h3>
                </div>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                  {session?.attendanceCount || 0} / {session?.totalStudents || 0}
                </div>
                <p className="text-gray-400 text-sm">
                  {session?.totalStudents > 0
                    ? `${((session.attendanceCount / session.totalStudents) * 100).toFixed(1)}% present`
                    : '0.0% present'}
                </p>
              </div>
              
              {/* Session Time Card */}
              <div className="bg-[#1a1f35] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <Clock className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Session Time</h3>
                </div>
                <div className="text-xl font-semibold text-white mb-2">
                  Started: {session?.startTime ? new Date(session.startTime).toLocaleTimeString() : 'N/A'}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-red-400 text-sm font-semibold">LIVE</span>
                </div>
              </div>
            </div>
            
            {/* QR Code & Verification Panel */}
            <div className="bg-[#1a1f35] border border-gray-800 rounded-2xl p-6 mb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <QrCode className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">QR Code & Verification</h3>
                </div>
                <button
                  onClick={toggleQR}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    qrEnabled
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {qrEnabled ? '✓ QR Enabled' : 'Enable QR Code'}
                </button>
              </div>
              
              {/* Verification Requirements */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <Settings className="text-white" size={20} />
                    </div>
                    <h4 className="font-bold text-white">Verification Requirements</h4>
                  </div>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-all text-sm font-semibold"
                  >
                    {showSettings ? '✓ Hide Settings' : '⚙️ Configure'}
                  </button>
                </div>
                
                {/* Verification Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* QR Code */}
                  <div className={`p-4 rounded-xl border-2 ${
                    verificationSettings.qrCode 
                      ? 'bg-green-600/10 border-green-600' 
                      : 'bg-gray-800/50 border-gray-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      {verificationSettings.qrCode ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <XCircle className="text-gray-500" size={20} />
                      )}
                      <div>
                        <div className="font-semibold text-white">QR Code</div>
                        <div className="text-xs text-gray-400">(Always Required)</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Face Liveness */}
                  <div className={`p-4 rounded-xl border-2 ${
                    verificationSettings.faceVerification 
                      ? 'bg-green-600/10 border-green-600' 
                      : 'bg-gray-800/50 border-gray-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      {verificationSettings.faceVerification ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <XCircle className="text-gray-500" size={20} />
                      )}
                      <div>
                        <div className="font-semibold text-white">Face Liveness</div>
                        <div className="text-xs text-gray-400">
                          {verificationSettings.faceVerification ? 'Required' : 'Optional'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* GPS Location */}
                  <div className={`p-4 rounded-xl border-2 ${
                    verificationSettings.locationVerification 
                      ? 'bg-green-600/10 border-green-600' 
                      : 'bg-gray-800/50 border-gray-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      {verificationSettings.locationVerification ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <XCircle className="text-gray-500" size={20} />
                      )}
                      <div>
                        <div className="font-semibold text-white">GPS Location</div>
                        <div className="text-xs text-gray-400">
                          {verificationSettings.locationVerification ? 'Required' : 'Optional'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Face Recognition - Coming Soon */}
                  <div className="p-4 rounded-xl border-2 bg-amber-900/10 border-amber-700 opacity-60">
                    <div className="flex items-center gap-3">
                      <Lock className="text-amber-500" size={20} />
                      <div>
                        <div className="font-semibold text-white">Face Recognition</div>
                        <div className="text-xs text-amber-400 font-semibold">Coming Soon</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fingerprint - Coming Soon */}
                  <div className="p-4 rounded-xl border-2 bg-amber-900/10 border-amber-700 opacity-60">
                    <div className="flex items-center gap-3">
                      <Lock className="text-amber-500" size={20} />
                      <div>
                        <div className="font-semibold text-white">Fingerprint</div>
                        <div className="text-xs text-amber-400 font-semibold">Coming Soon</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Background Checks */}
                  <div className="p-4 rounded-xl border-2 bg-blue-900/10 border-blue-700">
                    <div className="flex items-center gap-3">
                      <Zap className="text-blue-500" size={20} />
                      <div>
                        <div className="font-semibold text-white text-sm">Background Checks</div>
                        <div className="text-xs text-blue-400">Always Active</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Future Features Notice */}
                <div className="p-4 bg-amber-900/20 border border-amber-700 rounded-xl">
                  <p className="text-xs text-amber-400">
                    <strong>📌 Note:</strong> Face Recognition and Fingerprint verification require biometric enrollment data in the database. These features will be available once student biometric data is collected and stored securely.
                  </p>
                </div>
                
                {/* Settings Panel */}
                {showSettings && (
                  <div className="mt-6 p-6 bg-indigo-900/20 border-2 border-indigo-700 rounded-xl">
                    <h4 className="font-bold text-lg mb-4 text-white">⚙️ Configure Active Verification Methods</h4>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">👤</span>
                          <span className="font-semibold text-white">Require Face Liveness Detection (Real-time movement check)</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={verificationSettings.faceVerification}
                          onChange={(e) => {
                            const newSettings = { ...verificationSettings, faceVerification: e.target.checked };
                            updateVerificationSettings(newSettings);
                          }}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📍</span>
                          <span className="font-semibold text-white">Require GPS Location Verification (Geofencing)</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={verificationSettings.locationVerification}
                          onChange={(e) => {
                            const newSettings = { ...verificationSettings, locationVerification: e.target.checked };
                            updateVerificationSettings(newSettings);
                          }}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 p-3 bg-gray-800/50 rounded-lg">
                      💡 Students will need to complete all enabled verification methods. Background security checks (IP, proxy, device fingerprint) run automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* QR Code Display */}
            <div className="bg-[#1a1f35] border border-gray-800 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-8">
                Attendance QR Code
              </h2>
              {qrEnabled ? (
                <div className="flex justify-center">
                  <QRDisplay token={qrToken} rotationInterval={20000} />
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
                    <QrCode size={48} className="text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-6 text-lg">
                    No QR code available
                  </p>
                  <button
                    onClick={toggleQR}
                    className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-semibold"
                  >
                    🚀 Enable QR Code
                  </button>
                </div>
              )}
              <p className="text-center text-sm text-gray-400 mt-6">
                {qrEnabled 
                  ? '📱 Students should scan this QR code to mark their attendance'
                  : '💡 Enable QR code to allow students to mark attendance'
                }
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
