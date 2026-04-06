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
                <h1 className="text-3xl font-bold">{session?.title}</h1>
                <p className="text-muted-foreground">{session?.class?.name}</p>
              </div>
              <button
                onClick={handleEndSession}
                className="flex items-center space-x-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90"
              >
                <StopCircle size={20} />
                <span>End Session</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="text-primary" size={24} />
                  <h3 className="text-lg font-semibold">Attendance</h3>
                </div>
                <p className="text-3xl font-bold">
                  {session?.attendanceCount || 0} / {session?.totalStudents || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {session?.totalStudents > 0
                    ? `${((session.attendanceCount / session.totalStudents) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center space-x-3 mb-2">
                  <Clock className="text-green-500" size={24} />
                  <h3 className="text-lg font-semibold">Session Time</h3>
                </div>
                <p className="text-lg">
                  Started: {session?.startTime ? new Date(session.startTime).toLocaleTimeString() : 'N/A'}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  LIVE
                </span>
              </div>
            </div>
            
            {/* QR Code Control & Verification Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <QrCode className="text-indigo-500" size={24} />
                  <h3 className="text-lg font-semibold">QR Code & Verification</h3>
                </div>
                <button
                  onClick={toggleQR}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    qrEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  {qrEnabled ? '✓ QR Enabled' : 'Enable QR Code'}
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Settings className="text-indigo-500" size={20} />
                  <h4 className="font-semibold">Verification Requirements</h4>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors text-sm"
                >
                  {showSettings ? 'Hide Settings' : 'Configure'}
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
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-semibold mb-4">Configure Active Verification Methods</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verificationSettings.faceVerification}
                        onChange={(e) => {
                          const newSettings = { ...verificationSettings, faceVerification: e.target.checked };
                          updateVerificationSettings(newSettings);
                        }}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="font-medium">Require Face Liveness Detection (Real-time movement check)</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verificationSettings.locationVerification}
                        onChange={(e) => {
                          const newSettings = { ...verificationSettings, locationVerification: e.target.checked };
                          updateVerificationSettings(newSettings);
                        }}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="font-medium">Require GPS Location Verification (Geofencing)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                    Students will need to complete all enabled verification methods. Background security checks (IP, proxy, device fingerprint) run automatically.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-6 text-center">Attendance QR Code</h2>
              {qrEnabled ? (
                <div className="flex justify-center">
                  <QRDisplay token={qrToken} rotationInterval={20000} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    QR Code is currently disabled
                  </p>
                  <button
                    onClick={toggleQR}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Enable QR Code
                  </button>
                </div>
              )}
              <p className="text-center text-sm text-muted-foreground mt-6">
                {qrEnabled 
                  ? 'Students should scan this QR code to mark their attendance'
                  : 'Enable QR code to allow students to mark attendance'
                }
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
