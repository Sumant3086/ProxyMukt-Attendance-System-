import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import QRDisplay from '../components/QRDisplay';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';
import { Users, Clock, StopCircle } from 'lucide-react';

export default function StartSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    fetchSession();
    
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
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
    }
  }, [socket, session, id]);
  
  const fetchSession = async () => {
    try {
      const { data } = await axiosInstance.get(`/sessions/${id}`);
      setSession(data.data.session);
      
      if (data.data.session.status !== 'LIVE') {
        try {
          await axiosInstance.post(`/sessions/${id}/start`);
          const updated = await axiosInstance.get(`/sessions/${id}`);
          setSession(updated.data.data.session);
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
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-6 text-center">Attendance QR Code</h2>
              <div className="flex justify-center">
                <QRDisplay token={qrToken} rotationInterval={20000} />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Students should scan this QR code to mark their attendance
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
