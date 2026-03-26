import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import axiosInstance from '../utils/axiosInstance';
import { Users, Calendar, Shield, Search, Trash2, Eye } from 'lucide-react';
import { DEFAULT_PAGE_SIZE } from '../lib/constants';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // users, classes
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, totalSessions: 0, totalClasses: 0 });
  const [showConfirm, setShowConfirm] = useState(null);
  
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'classes') {
      fetchClasses();
    }
    fetchStats();
  }, [currentPage, searchTerm, roleFilter, activeTab]);
  
  const fetchStats = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/dashboard/stats');
      setStats(data.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });
      
      const { data } = await axiosInstance.get(`/admin/users?${params}`);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        ...(searchTerm && { search: searchTerm })
      });
      
      const { data } = await axiosInstance.get(`/admin/classes?${params}`);
      setClasses(data.data.classes);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await axiosInstance.delete(`/admin/students/${studentId}`);
      setShowConfirm(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Error removing student: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveFaculty = async (facultyId, removeClasses = false) => {
    try {
      await axiosInstance.delete(`/admin/faculty/${facultyId}`, {
        data: { removeClasses }
      });
      setShowConfirm(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Error removing faculty: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveStudentFromClass = async (classId, studentId) => {
    try {
      await axiosInstance.delete(`/admin/classes/${classId}/students/${studentId}`);
      fetchClasses();
    } catch (error) {
      alert('Error removing student: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      await axiosInstance.delete(`/admin/classes/${classId}`);
      setShowConfirm(null);
      fetchClasses();
      fetchStats();
    } catch (error) {
      alert('Error deleting class: ' + (error.response?.data?.message || error.message));
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="text-indigo-600" size={32} />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    System Management & Control
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="text-blue-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="text-purple-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Faculty</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFaculty}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Calendar className="text-orange-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Classes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Calendar className="text-green-600" size={24} />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setActiveTab('users'); setCurrentPage(1); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => { setActiveTab('classes'); setCurrentPage(1); }}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'classes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Classes
              </button>
            </div>
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Users</h2>
                    <div className="flex space-x-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                          className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                      </div>
                      <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      >
                        <option value="">All</option>
                        <option value="STUDENT">Students</option>
                        <option value="FACULTY">Faculty</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader size="md" />
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                user.role === 'FACULTY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm space-x-2">
                              {user.role !== 'ADMIN' && (
                                <button
                                  onClick={() => setShowConfirm({ type: user.role === 'FACULTY' ? 'faculty' : 'student', id: user._id })}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400"
                                  title="Remove user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                {/* Pagination */}
                {pagination && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!pagination.hasPrev}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                          disabled={!pagination.hasNext}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Classes</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search classes..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader size="md" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classes.map((cls) => (
                        <div key={cls._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-lg">{cls.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{cls.code} • {cls.department}</p>
                            </div>
                            <button
                              onClick={() => setShowConfirm({ type: 'class', id: cls._id })}
                              className="text-red-600 hover:text-red-800 dark:text-red-400"
                              title="Delete class"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Students</p>
                              <p className="font-bold">{cls.studentCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Sessions</p>
                              <p className="font-bold">{cls.sessionCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Attendance</p>
                              <p className="font-bold">{cls.totalAttendance}</p>
                            </div>
                          </div>
                          {cls.faculty && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Faculty: {cls.faculty.name}
                            </p>
                          )}
                          {cls.students && cls.students.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium mb-2">Students:</p>
                              <div className="space-y-1">
                                {cls.students.slice(0, 3).map((student) => (
                                  <div key={student._id} className="flex justify-between items-center text-xs">
                                    <span>{student.name}</span>
                                    <button
                                      onClick={() => handleRemoveStudentFromClass(cls._id, student._id)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                                {cls.students.length > 3 && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    +{cls.students.length - 3} more
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={!pagination.hasPrev}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                            disabled={!pagination.hasNext}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">Confirm Action</h3>
                  {showConfirm.type === 'student' && (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Are you sure you want to remove this student? They will be removed from all classes and their attendance records will be deleted.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleRemoveStudent(showConfirm.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                  {showConfirm.type === 'faculty' && (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        What would you like to do with this faculty's classes?
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleRemoveFaculty(showConfirm.id, false)}
                          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          Remove Faculty (Keep Classes)
                        </button>
                        <button
                          onClick={() => handleRemoveFaculty(showConfirm.id, true)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Remove Faculty & Delete Classes
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                  {showConfirm.type === 'class' && (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Are you sure you want to delete this class? All sessions and attendance records will be deleted.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDeleteClass(showConfirm.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
