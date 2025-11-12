import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosInstance';
import { Camera, CheckCircle, XCircle, MapPin, AlertTriangle } from 'lucide-react';

export default function ScanQR() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [stream, setStream] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking'); // checking, granted, denied, unavailable
  const [locationError, setLocationError] = useState('');
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setScanning(true);
      }
    } catch (error) {
      setMessage('Camera access denied');
      setMessageType('error');
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setScanning(false);
    }
  };
  
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // In production, use a QR scanner library like jsQR
    const qrToken = prompt('Enter QR code manually (for demo):');
    
    if (qrToken) {
      await markAttendance(qrToken);
    }
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
    try {
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
      
      setMessage('Marking attendance...');
      
      const { data } = await axiosInstance.post('/attendance/mark', {
        qrToken,
        location: locationData,
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
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white text-lg">Camera not started</p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4">
                {!scanning ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Camera size={20} />
                    <span>Start Camera</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={captureAndScan}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:opacity-90"
                    >
                      Capture & Scan
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:opacity-90"
                    >
                      Stop Camera
                    </button>
                  </>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Point your camera at the QR code displayed by your instructor
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
