import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosInstance';
import { Camera, CheckCircle, XCircle, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getDeviceInfo } from '../utils/deviceFingerprint';
import FaceVerification from '../components/FaceVerification';
import jsQR from 'jsqr';
import { 
  VERIFICATION_STEP_DELAY, 
  SUCCESS_MESSAGE_DELAY, 
  REDIRECT_DELAY, 
  QR_SCAN_INTERVAL, 
  LOCATION_TIMEOUT, 
  WEBSOCKET_RECONNECT_DELAY,
  DEFAULT_WEBSOCKET_URL
} from '../lib/constants';

export default function ScanQR() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [stream, setStream] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking');
  const [locationError, setLocationError] = useState('');
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanIntervalRef = useRef(null);
  
  // Sequential Verification State
  const [sessionRequirements, setSessionRequirements] = useState(null);
  const [verificationSteps, setVerificationSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [verificationResults, setVerificationResults] = useState({
    qrCode: null,
    faceVerification: null,
    locationVerification: null
  });
  
  // Step-specific states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Initialize verification flow based on session requirements
  const initializeVerificationFlow = (requirements) => {
    const steps = [];
    
    if (requirements.qrCode) {
      steps.push({ type: 'qrCode', name: 'QR Code Scan', icon: '📱' });
    }
    if (requirements.faceVerification) {
      steps.push({ type: 'faceVerification', name: 'Face Liveness Check', icon: '👤' });
    }
    if (requirements.locationVerification) {
      steps.push({ type: 'locationVerification', name: 'Location Verification', icon: '📍' });
    }
    
    setVerificationSteps(steps);
    setCurrentStep(0);
    setCompletedSteps([]);
    
    // Start first verification step
    if (steps.length > 0) {
      startVerificationStep(steps[0].type, 0);
    }
  };
  
  // Start specific verification step
  const startVerificationStep = (stepType, stepIndex = currentStep) => {
    const step = verificationSteps[stepIndex];
    setMessage(`${step?.icon} Step ${stepIndex + 1} of ${verificationSteps.length}: ${step?.name}`);
    setMessageType('info');
    
    switch (stepType) {
      case 'qrCode':
        setShowQRScanner(true);
        setShowFaceVerification(false);
        setShowLocationVerification(false);
        break;
      case 'faceVerification':
        setShowQRScanner(false);
        setShowFaceVerification(true);
        setShowLocationVerification(false);
        break;
      case 'locationVerification':
        setShowQRScanner(false);
        setShowFaceVerification(false);
        setShowLocationVerification(true);
        startLocationVerification();
        break;
    }
  };
  
  // Complete current step and move to next
  const completeVerificationStep = (stepType, result) => {
    const updatedResults = { ...verificationResults, [stepType]: result };
    setVerificationResults(updatedResults);
    
    const updatedCompleted = [...completedSteps, stepType];
    setCompletedSteps(updatedCompleted);
    
    const currentStepInfo = verificationSteps[currentStep];
    setMessage(`✅ ${currentStepInfo?.name || stepType} completed successfully!`);
    setMessageType('success');
    
    // Close current verification UI
    setShowQRScanner(false);
    setShowFaceVerification(false);
    setShowLocationVerification(false);
    
    // CRITICAL FIX: Check if this was the last step
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < verificationSteps.length) {
      // More steps remaining
      setTimeout(() => {
        setCurrentStep(nextStepIndex);
        startVerificationStep(verificationSteps[nextStepIndex].type, nextStepIndex);
      }, VERIFICATION_STEP_DELAY);
    } else {
      // All steps completed - mark attendance
      setMessage('🎉 All verifications complete! Marking attendance...');
      setTimeout(() => {
        markAttendanceWithResults(updatedResults);
      }, VERIFICATION_STEP_DELAY);
    }
  };
  
  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setScanning(true);
        setMessage('📱 Scanning for QR code...');
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
    }, QR_SCAN_INTERVAL);
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
      
      if (code && code.data) {
        stopCamera();
        handleQRDetected(code.data);
      }
    }
  };
  
  // Handle QR code detection
  const handleQRDetected = async (qrToken) => {
    try {
      setMessage('✅ QR Code detected! Checking session requirements...');
      setMessageType('success');
      
      // Verify QR token and get session requirements
      const [encodedPayload] = qrToken.split('.');
      const payloadString = atob(encodedPayload);
      const payload = JSON.parse(payloadString);
      
      const { data } = await axiosInstance.get(`/sessions/${payload.sid}`);
      const session = data.data.session;
      const requirements = session.verificationRequirements;
      
      setSessionRequirements(requirements);
      
      // CRITICAL FIX: Check if QR is the ONLY requirement
      const hasOnlyQR = requirements.qrCode && !requirements.faceVerification && !requirements.locationVerification;
      
      if (hasOnlyQR) {
        // QR only - mark attendance immediately
        setMessage('✅ QR verified! Only QR required - marking attendance...');
        setTimeout(() => {
          markAttendanceWithResults({ qrCode: { token: qrToken, verified: true } });
        }, REDIRECT_DELAY);
      } else {
        // Multi-step verification required
        initializeVerificationFlow(requirements);
        completeVerificationStep('qrCode', { token: qrToken, verified: true });
      }
      
    } catch (error) {
      setMessage('❌ Error verifying QR code. Please try again.');
      setMessageType('error');
      setShowQRScanner(true); // Allow retry
    }
  };
  
  // Handle face verification completion
  const handleFaceVerified = (result) => {
    completeVerificationStep('faceVerification', { verified: true, result });
  };
  
  // Handle face verification failure
  const handleFaceFailed = () => {
    setMessage('❌ Face liveness verification failed. Please try again.');
    setMessageType('error');
    // Reset to allow retry
    setTimeout(() => {
      setShowFaceVerification(true);
    }, SUCCESS_MESSAGE_DELAY);
  };
  
  // Start location verification
  const startLocationVerification = async () => {
    try {
      setMessage('📍 Getting your location...');
      const locationData = await getLocation();
      completeVerificationStep('locationVerification', { verified: true, location: locationData });
    } catch (error) {
      setMessage('❌ Location verification failed. Please enable location access.');
      setMessageType('error');
      // Allow retry
      setTimeout(() => {
        setShowLocationVerification(true);
        startLocationVerification();
      }, SUCCESS_MESSAGE_DELAY);
    }
  };
  
  // Get location function
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
          timeout: LOCATION_TIMEOUT,
          maximumAge: 0,
        }
      );
    });
  };
  
  // Mark attendance with all verification results
  const markAttendanceWithResults = async (results) => {
    if (attendanceMarked || isProcessing) return;
    
    try {
      setIsProcessing(true);
      setAttendanceMarked(true);
      
      setMessage('⚡ All verifications complete! Marking attendance...');
      setMessageType('info');
      
      // Get device information
      const deviceInfo = getDeviceInfo();
      
      const startTime = Date.now();
      const { data } = await axiosInstance.post('/attendance/mark', {
        qrToken: results.qrCode?.token,
        location: results.locationVerification?.location,
        deviceInfo: deviceInfo,
      });
      const processingTime = Date.now() - startTime;
      
      // Show detailed success message
      const successMsg = `🎉 ATTENDANCE MARKED SUCCESSFULLY!\n\n📚 Session: ${data.data.sessionTitle}\n🏫 Class: ${data.data.className}\n👤 Student: ${data.data.studentName}\n⚡ Processing Time: ${processingTime}ms`;
      setMessage(successMsg);
      setMessageType('success');
      
      // Show location verification details if available
      if (data.data?.locationVerification && data.data.locationVerification.distance !== null) {
        setTimeout(() => {
          setMessage(
            `${successMsg}\n\n📍 Location: ${data.data.locationVerification.distance}m from session location`
          );
        }, REDIRECT_DELAY);
      }
      
      // Redirect to dashboard
      setTimeout(() => {
        setMessage('✅ Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/student', { state: { refresh: true, attendanceMarked: true } });
        }, REDIRECT_DELAY);
      }, SUCCESS_MESSAGE_DELAY);
      
    } catch (error) {
      const errorData = error.response?.data;
      
      // Reset flags on error to allow retry
      setAttendanceMarked(false);
      setIsProcessing(false);
      
      // Handle specific proxy detection error
      if (errorData?.errorType === 'PROXY_DETECTION') {
        setMessage(`🚫 PROXY ATTENDANCE BLOCKED!\n\n${errorData.message}\n\n📱 Device: ${errorData.details.deviceId}\n👤 Previous Student: ${errorData.details.previousStudent} (${errorData.details.previousStudentId})\n\n⚠️ Each device can only mark attendance for ONE student per session.`);
      } else if (errorData?.requiresLocation) {
        setMessage('❌ Location verification is required for this session. Please enable location access and try again.');
      } else if (errorData?.details) {
        setMessage(`❌ ${errorData.message}: ${errorData.details.reason || JSON.stringify(errorData.details)}`);
      } else {
        setMessage(`❌ ${errorData?.message || 'Failed to mark attendance. Please try again.'}`);
      }
      
      setMessageType('error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Initialize verification flow on component mount
  const startVerificationFlow = () => {
    setMessage('🎯 Ready to start attendance verification!');
    setMessageType('info');
    
    // Start with QR scanner by default
    // Session requirements will be determined after QR scan
    setShowQRScanner(true);
  };
  
  useEffect(() => {
    // Check location permission on mount
    getLocation().catch(() => {
      // Location check failed, but continue anyway
    });
    
    // Collect device fingerprint on mount
    const deviceInfo = getDeviceInfo();
    setDeviceFingerprint(deviceInfo);
    
    // Setup WebSocket for real-time updates
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const userId = authData.state?.user?._id;
    const role = authData.state?.user?.role;
    
    if (userId && role) {
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || DEFAULT_WEBSOCKET_URL, {
        auth: { userId, role }
      });
      
      setSocket(newSocket);
      
      // Listen for attendance confirmation
      newSocket.on('attendance-confirmed', (data) => {
        if (!attendanceMarked) {
          setMessage('✅ Attendance confirmed! Redirecting to dashboard...');
          setMessageType('success');
          setAttendanceMarked(true);
          setTimeout(() => navigate('/student', { state: { refresh: true, attendanceMarked: true } }), WEBSOCKET_RECONNECT_DELAY);
        }
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sequential Attendance Verification
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">Complete all required verification steps</p>
            </div>
            
            {/* Verification Progress - Mobile Responsive */}
            {verificationSteps.length > 0 && (
              <div className="card-elevated p-4 sm:p-6 mb-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  Verification Progress
                </h3>
                {/* Mobile: Vertical Progress */}
                <div className="block sm:hidden space-y-3">
                  {verificationSteps.map((step, index) => (
                    <div key={step.type} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        completedSteps.includes(step.type)
                          ? 'bg-green-500 text-white'
                          : index === currentStep
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {completedSteps.includes(step.type) ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${
                          completedSteps.includes(step.type)
                            ? 'text-green-600'
                            : index === currentStep
                            ? 'text-blue-600'
                            : 'text-gray-500'
                        }`}>
                          {step.icon} {step.name}
                        </span>
                        {index === currentStep && (
                          <div className="text-xs text-blue-500 mt-1">Current Step</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop: Horizontal Progress */}
                <div className="hidden sm:flex items-center justify-center space-x-2 lg:space-x-4">
                  {verificationSteps.map((step, index) => (
                    <div key={step.type} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          completedSteps.includes(step.type)
                            ? 'bg-green-500 text-white'
                            : index === currentStep
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {completedSteps.includes(step.type) ? '✓' : index + 1}
                        </div>
                        <span className={`mt-2 text-xs text-center max-w-20 ${
                          completedSteps.includes(step.type)
                            ? 'text-green-600 font-semibold'
                            : index === currentStep
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                      </div>
                      {index < verificationSteps.length - 1 && (
                        <div className="mx-2 lg:mx-4 w-6 lg:w-8 h-0.5 bg-gray-300"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status Message - Mobile Responsive */}
            {message && (
              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${
                messageType === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  : messageType === 'info'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
              }`}>
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {messageType === 'success' ? <CheckCircle size={18} /> : messageType === 'info' ? <AlertTriangle size={18} /> : <XCircle size={18} />}
                  </div>
                  <span className="whitespace-pre-line text-sm sm:text-base leading-relaxed">{message}</span>
                </div>
              </div>
            )}
            
            {/* QR Scanner - Mobile Optimized */}
            {showQRScanner && (
              <div className="card-elevated p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Camera size={16} className="sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">QR Code Scanner</h2>
                    <span className="text-xs badge badge-info">Step {currentStep + 1} of {verificationSteps.length}</span>
                  </div>
                </div>
                
                {/* Mobile-optimized camera view */}
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative touch-none">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Mirror for better UX
                  />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0" />
                  
                  {!scanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-center px-4">
                        <Camera size={40} className="sm:w-12 sm:h-12 text-white mx-auto mb-4" />
                        <p className="text-white text-base sm:text-lg font-medium">Camera not started</p>
                        <p className="text-gray-300 text-sm mt-2">Tap "Start Camera" to scan QR code</p>
                      </div>
                    </div>
                  )}
                  
                  {scanning && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Mobile-optimized QR scanner overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 sm:w-64 sm:h-64 border-4 border-green-500 rounded-lg relative">
                          <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-green-500"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-green-500"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-green-500"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-green-500"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                        <p className="text-white text-sm bg-black/60 inline-block px-3 py-2 rounded-full">
                          📷 Scanning for QR code...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mobile-friendly buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {!scanning ? (
                    <button
                      onClick={startCamera}
                      className="btn-primary flex-1 flex items-center justify-center space-x-2 py-3 text-base font-medium"
                    >
                      <Camera size={20} />
                      <span>Start Camera</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="btn-danger flex-1 py-3 text-base font-medium"
                    >
                      Stop Camera
                    </button>
                  )}
                </div>
                
                {/* Mobile instructions */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-400 text-center">
                    📱 Hold your phone steady and point the camera at the QR code displayed by your instructor
                  </p>
                </div>
              </div>
            )}
            
            {/* Face Verification - Mobile Optimized */}
            {showFaceVerification && (
              <div className="card-elevated p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={16} className="sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Face Liveness Detection</h2>
                    <span className="text-xs badge badge-warning">Step {currentStep + 1} of {verificationSteps.length}</span>
                  </div>
                </div>
                <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <p className="text-sm text-purple-800 dark:text-purple-400">
                    👤 Please look at the camera and move your head slightly to confirm you're a real person.
                  </p>
                </div>
                <div className="touch-none">
                  <FaceVerification
                    autoStart={true}
                    onVerified={handleFaceVerified}
                    onFailed={handleFaceFailed}
                  />
                </div>
              </div>
            )}
            
            {/* Location Verification - Mobile Optimized */}
            {showLocationVerification && (
              <div className="card-elevated p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Location Verification</h2>
                    <span className="text-xs badge badge-success">Step {currentStep + 1} of {verificationSteps.length}</span>
                  </div>
                </div>
                <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <p className="text-sm text-green-800 dark:text-green-400">
                    📍 Verifying your location to ensure you're at the session venue...
                  </p>
                </div>
                {location && (
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg">
                    <p className="text-sm">
                      ✅ Location acquired: Accuracy ±{Math.round(location.accuracy)}m
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Start Button - Mobile Optimized */}
            {!showQRScanner && !showFaceVerification && !showLocationVerification && verificationSteps.length === 0 && (
              <div className="card-elevated p-4 sm:p-6 text-center">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-4">
                  Ready to Mark Attendance?
                </h3>
                <button
                  onClick={startVerificationFlow}
                  className="btn-primary flex items-center justify-center space-x-2 mx-auto py-3 px-6 text-base font-medium"
                >
                  <ShieldCheck size={20} />
                  <span>Start Verification</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}