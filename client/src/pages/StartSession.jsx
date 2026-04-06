import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import QRDisplay from '../components/QRDisplay';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';
import { Users, Clock, StopCircle, Settings, CheckCircle, XCircle, QrCode, Zap, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {session?.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">📚 {session?.class?.name}</p>
              </div>
              <button
                onClick={handleEndSession}
                className="btn-danger flex items-center space-x-2"
              >
                <StopCircle size={20} />
                <span>End Session</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="card-elevated p-6 hover-lift">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Users className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance</h3>
                </div>
                <p className="text-4xl font-bold text-gradient mb-2">
                  {session?.attendanceCount || 0} / {session?.totalStudents || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {session?.totalStudents > 0
                    ? `${((session.attendanceCount / session.totalStudents) * 100).toFixed(1)}% present`
                    : '0% present'}
                </p>
              </div>
              
              <div className="card-elevated p-6 hover-lift">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Clock className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Session Time</h3>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Started: {session?.startTime ? new Date(session.startTime).toLocaleTimeString() : 'N/A'}
                </p>
                <span className="badge badge-success">
                  🔴 LIVE
                </span>
              </div>
            </div>
            
            {/* QR Code Control & Verification Settings */}
            <div className="card-elevated p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <QrCode className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">QR Code & Verification</h3>
                </div>
                <button
                  onClick={toggleQR}
                  className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                    qrEnabled
                      ? 'btn-success'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white'
                  }`}
                >
                  {qrEnabled ? '✓ QR Enabled' : 'Enable QR Code'}
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Settings className="text-white" size={18} />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">Verification Requirements</h4>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:from-indigo-200 hover:to-purple-200 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all text-sm font-semibold"
                >
                  {showSettings ? '✓ Hide Settings' : '⚙️ Configure'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Active Verifications */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {verificationSettings.qrCode ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <XCircle className="text-gray-400" size={20} />
                  )}
                  <div className="flex-1">
                    <span className="font-medium">QR Code</span>
                    <p className="text-xs text-gray-500">(Always Required)</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {verificationSettings.faceVerification ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <XCircle className="text-gray-400" size={20} />
                  )}
                  <div className="flex-1">
                    <span className="font-medium">Face Liveness</span>
                    <p className="text-xs text-gray-500">
                      {verificationSettings.faceVerification ? 'Required' : 'Optional'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {verificationSettings.locationVerification ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <XCircle className="text-gray-400" size={20} />
                  )}
                  <div className="flex-1">
                    <span className="font-medium">GPS Location</span>
                    <p className="text-xs text-gray-500">
                      {verificationSettings.locationVerification ? 'Required' : 'Optional'}
                    </p>
                  </div>
                </div>
                
                {/* Future Features */}
                <div className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg opacity-60">
                  <Lock className="text-amber-600" size={20} />
                  <div className="flex-1">
                    <span className="font-medium">Face Recognition</span>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Coming Soon</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg opacity-60">
                  <Lock className="text-amber-600" size={20} />
                  <div className="flex-1">
                    <span className="font-medium">Fingerprint</span>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Coming Soon</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Zap className="text-blue-600" size={20} />
                  <div className="flex-1">
                    <span className="font-medium text-sm">Background Checks</span>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Always Active</p>
                  </div>
                </div>
              </div>
              
              {/* Future Features Notice */}
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  <strong>📌 Note:</strong> Face Recognition and Fingerprint verification require biometric enrollment data in the database. These features will be available once student biometric data is collected and stored securely.
                </p>
              </div>
              
              {showSettings && (
                <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-inner">
                  <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">⚙️ Configure Active Verification Methods</h4>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={verificationSettings.faceVerification}
                        onChange={(e) => {
                          const newSettings = { ...verificationSettings, faceVerification: e.target.checked };
                          updateVerificationSettings(newSettings);
                        }}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">👤 Require Face Liveness Detection (Real-time movement check)</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={verificationSettings.locationVerification}
                        onChange={(e) => {
                          const newSettings = { ...verificationSettings, locationVerification: e.target.checked };
                          updateVerificationSettings(newSettings);
                        }}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">📍 Require GPS Location Verification (Geofencing)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    💡 Students will need to complete all enabled verification methods. Background security checks (IP, proxy, device fingerprint) run automatically.
                  </p>
                </div>
              )}
            </div>
            
            <div className="card-elevated p-8">
              <h2 className="text-3xl font-bold mb-6 text-center text-gradient">Attendance QR Code</h2>
              {qrEnabled ? (
                <div className="flex justify-center">
                  <QRDisplay token={qrToken} rotationInterval={20000} />
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <QrCode size={48} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                    QR Code is currently disabled
                  </p>
                  <button
                    onClick={toggleQR}
                    className="btn-primary"
                  >
                    🚀 Enable QR Code
                  </button>
                </div>
              )}
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
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
