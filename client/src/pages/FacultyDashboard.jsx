import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import LocationPicker from '../components/LocationPicker';
import axiosInstance from '../utils/axiosInstance';
import { Plus, Calendar, Users } from 'lucide-react';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showStartSession, setShowStartSession] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: '',
    semester: '',
  });
  const [sessionData, setSessionData] = useState({
    title: '',
    location: null,
    sessionType: 'offline', // 'offline' or 'online'
    onlinePlatform: 'ZOOM', // 'ZOOM', 'GOOGLE_MEET', 'TEAMS'
    qrEnabled: true, // QR Code toggle
    faceVerification: false, // Face liveness toggle
    locationVerification: false, // Geofencing toggle
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const [classesRes, sessionsRes] = await Promise.all([
        axiosInstance.get('/classes'),
        axiosInstance.get('/sessions'),
      ]);
      
      // Filter classes to only show those with LIVE sessions
      const allClasses = classesRes.data.data.classes;
      const allSessions = sessionsRes.data.data.sessions;
      
      // Get classes with live sessions
      const liveSessionClassIds = allSessions
        .filter(s => s.status === 'LIVE')
        .map(s => s.class?._id || s.class);
      
      // Separate classes into live and non-live
      const classesWithLiveSessions = allClasses.filter(c => 
        liveSessionClassIds.includes(c._id)
      );
      const classesWithoutLiveSessions = allClasses.filter(c => 
        !liveSessionClassIds.includes(c._id)
      );
      
      // Show live sessions first, then others
      setClasses([...classesWithLiveSessions, ...classesWithoutLiveSessions]);
      setSessions(allSessions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/classes', formData);
      setShowCreateClass(false);
      fetchData();
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };
  
  const openStartSessionModal = (cls) => {
    setSelectedClass(cls);
    setSessionData({
      title: `${cls.name} - Lecture`,
      location: null,
      sessionType: 'offline', // Default to offline
      onlinePlatform: 'ZOOM', // Default to Zoom
    });
    setShowStartSession(true);
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    try {
      // Create regular session first with verification settings
      const { data } = await axiosInstance.post('/sessions', {
        classId: selectedClass._id,
        title: sessionData.title,
        date: new Date(),
        startTime: new Date(),
        location: sessionData.sessionType === 'offline' ? sessionData.location : null,
        sessionType: sessionData.sessionType.toUpperCase(),
        qrEnabled: sessionData.qrEnabled,
        verificationRequirements: {
          qrCode: sessionData.qrEnabled,
          faceVerification: sessionData.faceVerification,
          locationVerification: sessionData.locationVerification,
        },
      });

      const sessionId = data.data.session._id;

      // If online session, create Zoom/Meet/Teams meeting
      if (sessionData.sessionType === 'online') {
        if (sessionData.onlinePlatform === 'ZOOM') {
          try {
            const zoomRes = await axiosInstance.post('/zoom/create', {
              sessionId,
              topic: sessionData.title,
              duration: 60,
            });
            
            // Navigate to monitor page
            setShowStartSession(false);
            navigate(`/online-session-monitor/${zoomRes.data.data.onlineSession._id}`);
          } catch (zoomError) {
            // If Zoom creation fails, show error and offer manual option
            const errorMsg = zoomError.response?.data?.message || 'Failed to create Zoom meeting';
            const useManual = confirm(
              `${errorMsg}\n\nWould you like to create a manual online session instead? You can add your Zoom link manually.`
            );
            
            if (useManual) {
              // Create generic online session
              const onlineRes = await axiosInstance.post('/online-sessions', {
                sessionId,
                platform: 'ZOOM',
                meetingLink: '', // Faculty can add manually
              });
              
              setShowStartSession(false);
              navigate(`/online-session-monitor/${onlineRes.data.data.onlineSession._id}`);
            } else {
              // Cancel and go to regular session
              setShowStartSession(false);
              navigate(`/session/${sessionId}`);
            }
          }
        } else {
          // For other platforms, create generic online session
          const onlineRes = await axiosInstance.post('/online-sessions', {
            sessionId,
            platform: sessionData.onlinePlatform,
            meetingLink: '', // Faculty can add manually
          });
          
          setShowStartSession(false);
          navigate(`/online-session-monitor/${onlineRes.data.data.onlineSession._id}`);
        }
      } else {
        // Offline session - navigate to QR code page
        setShowStartSession(false);
        navigate(`/session/${sessionId}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session: ' + (error.response?.data?.message || error.message));
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
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
              <button
                onClick={() => setShowCreateClass(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                <Plus size={20} />
                <span>Create Class</span>
              </button>
            </div>
            
            {showCreateClass && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
                  <h2 className="text-xl font-bold mb-4">Create New Class</h2>
                  <form onSubmit={handleCreateClass} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Class Name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Class Code"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Department"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg bg-background"
                    />
                    <div className="flex space-x-2">
                      <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateClass(false)}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showStartSession && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-4">Start New Session</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Class: {selectedClass?.name} ({selectedClass?.code})
                  </p>
                  <form onSubmit={handleStartSession} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Session Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Lecture 5 - Data Structures"
                        required
                        value={sessionData.title}
                        onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Session Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSessionData({ ...sessionData, sessionType: 'offline' })}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            sessionData.sessionType === 'offline'
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <div className="text-2xl mb-2">🏫</div>
                          <div className="font-semibold">Offline Class</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">QR Code Attendance</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSessionData({ ...sessionData, sessionType: 'online' })}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            sessionData.sessionType === 'online'
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <div className="text-2xl mb-2">💻</div>
                          <div className="font-semibold">Online Class</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Zoom/Meet/Teams</div>
                        </button>
                      </div>
                    </div>

                    {sessionData.sessionType === 'online' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Online Platform</label>
                        <select
                          value={sessionData.onlinePlatform}
                          onChange={(e) => setSessionData({ ...sessionData, onlinePlatform: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="ZOOM">🎥 Zoom (Auto-create meeting)</option>
                          <option value="GOOGLE_MEET">📹 Google Meet</option>
                          <option value="TEAMS">💼 Microsoft Teams</option>
                          <option value="WEBRTC">🌐 Custom Platform</option>
                        </select>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {sessionData.onlinePlatform === 'ZOOM' 
                            ? '✨ Zoom meeting will be created automatically with attendance tracking'
                            : 'You can add meeting link after creation'}
                        </p>
                      </div>
                    )}

                    {sessionData.sessionType === 'offline' && (
                      <>
                        <LocationPicker
                          value={sessionData.location}
                          onChange={(location) => setSessionData({ ...sessionData, location })}
                        />
                        
                        {/* Verification Methods Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold">Verification Methods</h4>
                          
                          {/* QR Code Toggle */}
                          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">📱</div>
                              <div>
                                <div className="font-medium text-white">Enable QR Code</div>
                                <div className="text-sm text-gray-400">Students scan QR to mark attendance</div>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sessionData.qrEnabled}
                                onChange={(e) => setSessionData({ ...sessionData, qrEnabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                          
                          {/* Face Liveness Toggle */}
                          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">👤</div>
                              <div>
                                <div className="font-medium text-white">Enable Face Liveness</div>
                                <div className="text-sm text-gray-400">Real-time movement check (not facial recognition)</div>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sessionData.faceVerification}
                                onChange={(e) => setSessionData({ ...sessionData, faceVerification: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                          
                          {/* Geofencing Toggle */}
                          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">📍</div>
                              <div>
                                <div className="font-medium text-white">Enable Geofencing</div>
                                <div className="text-sm text-gray-400">Require students to be at the session location</div>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sessionData.locationVerification}
                                onChange={(e) => setSessionData({ ...sessionData, locationVerification: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex space-x-2">
                      <button 
                        type="submit" 
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                      >
                        Start Session
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowStartSession(false)}
                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div key={cls._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-2">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{cls.code}</p>
                  <div className="flex items-center space-x-2 text-sm mb-4">
                    <Users size={16} />
                    <span>{cls.students?.length || 0} students</span>
                  </div>
                  <button
                    onClick={() => openStartSessionModal(cls)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Calendar size={18} />
                    <span>Start Session</span>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Recent Sessions</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sessions.slice(0, 5).map((session) => (
                      <tr key={session._id}>
                        <td className="px-6 py-4">{session.class?.name}</td>
                        <td className="px-6 py-4">{new Date(session.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            session.status === 'LIVE' ? 'bg-green-100 text-green-800' :
                            session.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {session.attendanceCount}/{session.totalStudents}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
