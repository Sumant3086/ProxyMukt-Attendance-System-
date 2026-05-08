import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { FACE_API_MODEL_URL } from '../lib/constants';

export default function FaceVerification({ onVerified, onFailed, autoStart = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | loading | ready | detecting | verified | failed
  const [message, setMessage] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBox, setFaceBox] = useState(null);

  useEffect(() => {
    loadModels();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (autoStart && modelsLoaded) startCamera();
  }, [autoStart, modelsLoaded]);

  const loadModels = async () => {
    setStatus('loading');
    setMessage('Loading face detection models...');
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_API_MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus('ready');
      setMessage('Ready to detect live presence. Note: No biometric data is stored yet - identity verification will be available in future updates.');
    } catch (err) {
      console.error('Model load error:', err);
      setStatus('failed');
      setMessage('Face detection models failed to load. Check your internet connection and refresh.');
      setTimeout(() => onFailed && onFailed(), 1000);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('detecting');
      setMessage('Look at the camera...');
      startDetection();
    } catch (err) {
      setStatus('failed');
      setMessage('Camera access denied. Please enable camera permissions in your browser settings.');
      setTimeout(() => onFailed && onFailed(), 1000);
    }
  };

  const startDetection = () => {
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds at 500ms intervals

    intervalRef.current = setInterval(async () => {
      attempts++;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);

        if (detection) {
          // Draw box on canvas
          if (canvasRef.current && videoRef.current) {
            const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
            const resized = faceapi.resizeResults(detection, dims);
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            faceapi.draw.drawDetections(canvasRef.current, resized);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
          }

          setFaceBox(detection.detection.box);
          setStatus('verified');
          setMessage('✓ Live presence confirmed. Note: Identity verification requires biometric enrollment (not yet available).');
          clearInterval(intervalRef.current);
          cleanup();
          setTimeout(() => onVerified && onVerified({ 
            score: detection.detection.score,
            note: 'Liveness detection only - no biometric comparison performed' 
          }), 1500);
        } else {
          setFaceBox(null);
          if (attempts >= maxAttempts) {
            clearInterval(intervalRef.current);
            setStatus('failed');
            setMessage('⚠️ No face detected. Please retry and ensure your face is clearly visible.');
            cleanup();
            setTimeout(() => onFailed && onFailed(), 1000);
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, 500);
  };

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const statusColors = {
    idle: 'text-gray-400',
    loading: 'text-blue-400',
    ready: 'text-blue-400',
    detecting: 'text-yellow-400',
    verified: 'text-green-400',
    failed: 'text-red-400',
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Camera size={18} className="text-purple-400" />
        <span className="text-white font-semibold text-sm">Liveness Detection</span>
        <span className="text-xs text-gray-400 ml-1">(No Identity Verification)</span>
        {status === 'verified' && <CheckCircle size={16} className="text-green-400 ml-auto" />}
        {status === 'failed' && <XCircle size={16} className="text-red-400 ml-auto" />}
        {(status === 'loading' || status === 'detecting') && (
          <Loader2 size={16} className="text-blue-400 ml-auto animate-spin" />
        )}
      </div>
      
      {/* Info Banner */}
      <div className="mb-3 p-2 bg-amber-900/30 border border-amber-700/50 rounded-lg">
        <p className="text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span><strong>Liveness Detection Only:</strong> This verifies a live person is present but does not confirm identity. Biometric enrollment and facial recognition features are not yet implemented.</span>
        </p>
      </div>

      {/* Video + Canvas overlay */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />
        {status === 'idle' || status === 'loading' || status === 'ready' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            {status === 'loading' ? (
              <Loader2 size={32} className="text-blue-400 animate-spin" />
            ) : (
              <Camera size={32} className="text-gray-400" />
            )}
          </div>
        ) : null}
        {status === 'verified' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-900/40">
            <CheckCircle size={48} className="text-green-400" />
          </div>
        )}
      </div>

      {/* Status message */}
      <p className={`text-xs text-center ${statusColors[status]}`}>{message}</p>

      {/* Start button */}
      {(status === 'ready') && (
        <button
          onClick={startCamera}
          className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
        >
          Start Liveness Check
        </button>
      )}

      {status === 'detecting' && (
        <div className="mt-2 flex items-center gap-2 justify-center">
          <AlertTriangle size={14} className="text-yellow-400" />
          <span className="text-yellow-400 text-xs">Keep your face in frame</span>
        </div>
      )}
    </div>
  );
}
