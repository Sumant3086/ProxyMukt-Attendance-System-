import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosInstance';
import { Camera, CheckCircle, XCircle, MapPin, AlertTriangle, ShieldCheck, Smartphone, Monitor } from 'lucide-react';
import { getDeviceInfo } from '../utils/deviceFingerprint';
import FaceVerification from '../components/FaceVerification';
import jsQR from 'jsqr';

export default function ScanQR() {
  const navigate = useNavigate();
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
    if (!videoRef.current || !canvasRef.current || attendanceMarked || showFaceVerification) return;
    
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
        // QR code detected! Stop scanning immediately
        stopCamera();
        setMessage('✓ QR Code detected! Starting face verification...');
        setMessageType('success');
        
        // Trigger face verification
        setPendingQrToken(code.data);
        setShowFaceVerification(true);
      }
    }
  };

  const handleFaceVerified = async (result) => {
    if (attendanceMarked) return; // Prevent duplicate calls
    
    setFaceVerified(true);
    setShowFaceVerification(false);
    
    if (result?.bypassed) {
      setMessage('⚠️ Face verification skipped. Marking attendance...');
    } else if (result?.note) {
      setMessage('✓ Live face detected! Marking attendance...');
    } else {
      setMessage('✓ Face detected! Marking attendance...');
    }
    
    setMessageType('info');
    if (pendingQrToken) {
      await markAttendance(pendingQrToken);
    }
  };

  const handleFaceFailed = async () => {
    setShowFaceVerification(false);
    setMessage('⚠️ Face verification incomplete. You can try again or scan a new QR code.');
    setMessageType('error');
    setPendingQrToken(null);
    setFaceVerified(false);
    setAttendanceMarked(false); // Reset to allow retry
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
      
      setMessage(data.message);
      setMessageType('success');
      
      // Show location verification details if available
      if (data.data?.locationVerification) {
        const verification = data.data.locationVerification;
        if (verification.distance !== null) {
          setMessage(
            `${data.message} (Distance: ${verification.distance}m from session location)`
          );
        }
      }
      
      stopCamera();
      
      setTimeout(() => {
        navigate('/student');
      }, 2000);
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
            <h1 className="text-3xl font-bold mb-8">Scan QR Code</h1>
            
            {/* Security Features Info */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    🔒 Multi-Layer Security Active
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>✓ Device fingerprinting enabled (tracking your unique device)</li>
                    <li>✓ Liveness detection (verifies a real person is present)</li>
                    <li>✓ Location verification active (GPS-based geofencing)</li>
                    <li>✓ Proxy/VPN detection running (prevents spoofing)</li>
                  </ul>
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded">
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      <strong>Note:</strong> Biometric enrollment is not yet implemented. The system currently performs liveness detection (confirms a live person) but does not verify identity against stored biometric data. Full facial recognition and fingerprint verification will be available in future updates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Device Fingerprint Info */}
            {deviceFingerprint && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Smartphone className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      Device Information Collected
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-800 dark:text-green-400">
                      <div>
                        <span className="font-medium">Browser:</span> {deviceFingerprint.userAgent.includes('Chrome') ? 'Chrome' : deviceFingerprint.userAgent.includes('Firefox') ? 'Firefox' : deviceFingerprint.userAgent.includes('Safari') ? 'Safari' : 'Other'}
                      </div>
                      <div>
                        <span className="font-medium">Platform:</span> {deviceFingerprint.platform}
                      </div>
                      <div>
                        <span className="font-medium">Screen:</span> {deviceFingerprint.screenResolution}
                      </div>
                      <div>
                        <span className="font-medium">Timezone:</span> {deviceFingerprint.timezone}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Device ID:</span> 
                        <code className="ml-1 text-[10px] bg-green-100 dark:bg-green-900/40 px-1 py-0.5 rounded">
                          {deviceFingerprint.fingerprint.substring(0, 24)}...
                        </code>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-500 mt-2 italic">
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
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              {/* Face Verification Panel */}
              {showFaceVerification && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={20} className="text-purple-500" />
                    <h2 className="font-semibold text-lg">Step 2: Liveness Detection</h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(Identity verification not available)</span>
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
                  <span className="text-sm font-medium">Live presence confirmed (identity not verified)</span>
                </div>
              )}

              {/* Show retry button after failed face verification */}
              {!showFaceVerification && !faceVerified && !scanning && pendingQrToken && (
                <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-400 text-sm mb-3">
                    Liveness detection was not completed. You can try again or scan a new QR code.
                  </p>
                  <button
                    onClick={() => setShowFaceVerification(true)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Retry Liveness Detection
                  </button>
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
                
                {scanning && (
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
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Camera size={20} />
                    <span>Start Camera</span>
                  </button>
                ) : scanning ? (
                  <button
                    onClick={stopCamera}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:opacity-90"
                  >
                    Stop Camera
                  </button>
                ) : null}
              </div>
              
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {!scanning && !showFaceVerification && 'Point your camera at the QR code displayed by your instructor'}
                {scanning && 'Hold steady - QR code will be detected automatically'}
                {showFaceVerification && 'Complete liveness check to mark attendance'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
