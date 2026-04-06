import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosInstance';
import { Camera, CheckCircle, XCircle, MapPin, AlertTriangle, ShieldCheck, Smartphone, Monitor } from 'lucide-react';
import { getDeviceInfo } from '../utils/deviceFingerprint';
import FaceVerification from '../components/FaceVerification';
import jsQR from 'jsqr';

export default function ScanQR() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [stream, setStream] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking');
  const [locationError, setLocationError] = useState('');
  const [faceVerified, setFaceVerified] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [pendingQrToken, setPendingQrToken] = useState(null);
  const scanIntervalRef = useRef(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false); // Prevent infinite loop
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setScanning(true);
        setMessage('Scanning for QR code...');
        setMessageType('info');
        startQRScanning();
      }
    } catch (error) {
      setMessage('Camera access denied. Please enable camera permissions.');
      setMessageType('error');
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setScanning(false);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };
  
  const startQRScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 500); // Scan every 500ms
  };
  
  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || attendanceMarked) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      
      if (code && code.data && !pendingQrToken) {
        // QR code detected! Stop scanning
        stopCamera();
        setPendingQrToken(code.data);
        
        // Fetch session requirements to determine next steps
        fetchSessionRequirements(code.data);
      }
    }
  };

  const fetchSessionRequirements = async (qrToken) => {
    try {
      setMessage('✓ QR Code detected! Checking requirements...');
      setMessageType('success');
      
      // Decode QR to get session ID
      const [encodedPayload] = qrToken.split('.');
      const payloadString = atob(encodedPayload);
      const payload = JSON.parse(payloadString);
      
      // Get session details
      const { data } = await axiosInstance.get(`/sessions/${payload.sid}`);
      const requirements = data.data.session.verificationRequirements;
      
      // Check what's required
      if (requirements?.faceVerification) {
        setMessage('✓ QR verified! Now checking face liveness...');
        setShowFaceVerification(true);
      } else {
        // No face verification required, proceed to mark attendance
        setMessage('✓ QR verified! Marking attendance...');
        await markAttendance(qrToken);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      setMessage('Error checking requirements. Proceeding with attendance...');
      await markAttendance(qrToken);
    }
  };

  const handleFaceVerified = async (result) => {
    // Face liveness verified, proceed to mark attendance
    setFaceVerified(true);
    setShowFaceVerification(false);
    
    if (result?.bypassed) {
      setMessage('⚠️ Face verification skipped. Marking attendance...');
    } else if (result?.note) {
      setMessage('✓ Live face detected! Marking attendance...');
    } else {
      setMessage('✓ Face liveness confirmed! Marking attendance...');
    }
    
    setMessageType('info');
    if (pendingQrToken) {
      await markAttendance(pendingQrToken);
    }
  };

  const handleFaceFailed = async () => {
    // Face verification failed - block attendance if required
    setShowFaceVerification(false);
    setMessage('❌ Face liveness verification failed. Please try again.');
    setMessageType('error');
    setPendingQrToken(null);
    setFaceVerified(false);
    setAttendanceMarked(false);
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationStatus('unavailable');
        setLocationError('Geolocation is not supported by your browser');
        reject(new Error('Geolocation not supported'));
        return;
      }

      setLocationStatus('checking');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setLocation(locationData);
          setLocationStatus('granted');
          resolve(locationData);
        },
        (error) => {
          setLocationStatus('denied');
          let errorMsg = 'Location access denied';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Location request timed out.';
              break;
            default:
              errorMsg = 'An unknown error occurred.';
          }
          
          setLocationError(errorMsg);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const markAttendance = async (qrToken) => {
    if (attendanceMarked) return; // Prevent duplicate submissions
    
    try {
      setAttendanceMarked(true); // Set flag immediately to prevent duplicates
      
      setMessage('Getting your location...');
      setMessageType('info');
      
      // Get current location
      let locationData = null;
      try {
        locationData = await getLocation();
      } catch (error) {
        // Try to mark attendance without location (backend will decide if it's required)
        console.warn('Location not available:', error);
      }
      
      setMessage('Collecting device information...');
      
      // Get device information
      const deviceInfo = getDeviceInfo();
      console.log('📱 Device Fingerprint:', deviceInfo); // Log for visibility
      
      setMessage('Marking attendance...');
      
      const { data } = await axiosInstance.post('/attendance/mark', {
        qrToken,
        location: locationData,
        deviceInfo,
      });
      
      // Show detailed success message
      const successMsg = `✓ ${data.message}\n\nSession: ${data.data.sessionTitle}\nClass: ${data.data.className}`;
      setMessage(successMsg);
      setMessageType('success');
      
      // Show location verification details if available
      if (data.data?.locationVerification && data.data.locationVerification.distance !== null) {
        setTimeout(() => {
          setMessage(
            `${successMsg}\n\nLocation: ${data.data.locationVerification.distance}m from session`
          );
        }, 1000);
      }
      
      stopCamera();
      
      setTimeout(() => {
        navigate('/student', { state: { refresh: true } });
      }, 3000);
    } catch (error) {
      const errorData = error.response?.data;
      
      // Reset flag on error to allow retry
      setAttendanceMarked(false);
      setPendingQrToken(null);
      setFaceVerified(false);
      
      if (errorData?.requiresLocation) {
        setMessage('Location verification is required for this session. Please enable location access.');
      } else if (errorData?.details) {
        setMessage(`${errorData.message}: ${errorData.details.reason || JSON.stringify(errorData.details)}`);
      } else {
        setMessage(errorData?.message || 'Failed to mark attendance');
      }
      
      setMessageType('error');
    }
  };
  
  useEffect(() => {
    // Check location permission on mount
    getLocation().catch(() => {
      // Location check failed, but continue anyway
    });
    
    // Collect device fingerprint on mount
    const deviceInfo = getDeviceInfo();
    setDeviceFingerprint(deviceInfo);
    console.log('📱 Device Fingerprint Collected:', deviceInfo);
    
    // Setup WebSocket for real-time updates
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authData.state?.user?._id;
    const role = authData.state?.user?.role;
    
    if (userId && role) {
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { userId, role }
      });
      
      setSocket(newSocket);
      
      // Listen for attendance confirmation
      newSocket.on('attendance-confirmed', (data) => {
        console.log('✅ Attendance confirmed via WebSocket:', data);
        setMessage('✓ Attendance confirmed! Redirecting...');
        setMessageType('success');
        setTimeout(() => navigate('/student', { state: { refresh: true } }), 1500);
      });
      
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
        stopCamera();
      };
    }
    
    return () => {
      stopCamera();
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Scan QR Code
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Mark your attendance by scanning the QR code</p>
            </div>
            
            {/* Security Features Info */}
            <div className="card-elevated p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                    🔒 Multi-Layer Security Active
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Faculty-Controlled Verification:</div>
                      <ul className="space-y-1 ml-4">
                        <li>✓ QR Code scanning (always required)</li>
                        <li>✓ Face liveness detection (if enabled by faculty)</li>
                        <li>✓ GPS location verification (if enabled by faculty)</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">Background Security Checks:</div>
                      <ul className="space-y-1 ml-4">
                        <li>• Device fingerprinting (tracks your device)</li>
                        <li>• Proxy/VPN detection (prevents spoofing)</li>
                        <li>• IP reputation analysis (datacenter detection)</li>
                        <li>• Impossible travel detection (location consistency)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-400">
                      <strong>✓ Smart Flow:</strong> Complete required verifications (QR → Face → Location) in sequence. Background security checks run automatically without blocking your attendance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Device Fingerprint Info */}
            {deviceFingerprint && (
              <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
                      Device Information Collected
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs text-green-800 dark:text-green-400">
                      <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <span className="font-bold block mb-1">Browser:</span> 
                        {deviceFingerprint.userAgent.includes('Chrome') ? 'Chrome' : deviceFingerprint.userAgent.includes('Firefox') ? 'Firefox' : deviceFingerprint.userAgent.includes('Safari') ? 'Safari' : 'Other'}
                      </div>
                      <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <span className="font-bold block mb-1">Platform:</span> 
                        {deviceFingerprint.platform}
                      </div>
                      <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <span className="font-bold block mb-1">Screen:</span> 
                        {deviceFingerprint.screenResolution}
                      </div>
                      <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <span className="font-bold block mb-1">Timezone:</span> 
                        {deviceFingerprint.timezone}
                      </div>
                      <div className="col-span-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <span className="font-bold block mb-1">Device ID:</span> 
                        <code className="text-[10px] bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">
                          {deviceFingerprint.fingerprint.substring(0, 24)}...
                        </code>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-500 mt-3 italic p-2 bg-white/30 dark:bg-gray-800/30 rounded">
                      This device signature helps track attendance patterns and detect suspicious activity. Note: This is not biometric data - it's technical device information only.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Location Status */}
            <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
              locationStatus === 'granted'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                : locationStatus === 'denied'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                : locationStatus === 'checking'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
            }`}>
              <MapPin size={20} />
              <div className="flex-1">
                <p className="font-medium">
                  {locationStatus === 'granted' && 'Location Access Granted'}
                  {locationStatus === 'denied' && 'Location Access Denied'}
                  {locationStatus === 'checking' && 'Checking Location...'}
                  {locationStatus === 'unavailable' && 'Location Unavailable'}
                </p>
                {location && locationStatus === 'granted' && (
                  <p className="text-sm mt-1">
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </p>
                )}
                {locationError && (
                  <p className="text-sm mt-1">{locationError}</p>
                )}
              </div>
              {locationStatus === 'denied' && (
                <button
                  onClick={getLocation}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              )}
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
                messageType === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  : messageType === 'info'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
              }`}>
                {messageType === 'success' ? <CheckCircle size={20} /> : messageType === 'info' ? <AlertTriangle size={20} /> : <XCircle size={20} />}
                <span>{message}</span>
              </div>
            )}
            
            <div className="card-elevated p-6">
              {/* Face Verification Panel (shown when required) */}
              {showFaceVerification && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <ShieldCheck size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-gray-900 dark:text-white">Step 2: Face Liveness Detection</h2>
                      <span className="text-xs badge badge-warning">Required by faculty</span>
                    </div>
                  </div>
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <p className="text-sm text-purple-800 dark:text-purple-400">
                      👤 Please look at the camera and move your head slightly to confirm you're a real person.
                    </p>
                  </div>
                  <FaceVerification
                    autoStart={true}
                    onVerified={handleFaceVerified}
                    onFailed={handleFaceFailed}
                  />
                </div>
              )}

              {faceVerified && !showFaceVerification && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">✓ Face liveness confirmed</span>
                </div>
              )}

              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0" />
                
                {!scanning && !showFaceVerification && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center">
                      <Camera size={48} className="text-white mx-auto mb-4" />
                      <p className="text-white text-lg">Camera not started</p>
                      <p className="text-gray-300 text-sm mt-2">Click "Start Camera" to scan QR code</p>
                    </div>
                  </div>
                )}
                
                {scanning && !showFaceVerification && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* QR Scanner overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-white text-sm bg-black/60 inline-block px-4 py-2 rounded-full">
                        📷 Scanning for QR code...
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4">
                {!scanning && !showFaceVerification ? (
                  <button
                    onClick={startCamera}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <Camera size={20} />
                    <span>Start Camera</span>
                  </button>
                ) : scanning && !showFaceVerification ? (
                  <button
                    onClick={stopCamera}
                    className="btn-danger flex-1"
                  >
                    Stop Camera
                  </button>
                ) : null}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center font-medium">
                {!scanning && !showFaceVerification && '📱 Point your camera at the QR code displayed by your instructor'}
                {scanning && !showFaceVerification && '⏳ Hold steady - QR code will be detected automatically'}
                {showFaceVerification && '👤 Complete face liveness check to proceed'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
