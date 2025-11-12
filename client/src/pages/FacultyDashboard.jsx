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
      setClasses(classesRes.data.data.classes);
      setSessions(sessionsRes.data.data.sessions);
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
    });
    setShowStartSession(true);
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.post('/sessions', {
        classId: selectedClass._id,
        title: sessionData.title,
        date: new Date(),
        startTime: new Date(),
        location: sessionData.location,
      });
      setShowStartSession(false);
      navigate(`/session/${data.data.session._id}`);
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

                    <LocationPicker
                      value={sessionData.location}
                      onChange={(location) => setSessionData({ ...sessionData, location })}
                    />

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
