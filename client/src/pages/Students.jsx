import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Users, Search, Filter, Download, Mail, TrendingUp, TrendingDown } from 'lucide-react';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students] = useState([
    {
      id: 1,
      name: 'John Doe',
      studentId: 'ST001',
      email: 'john@example.com',
      class: 'CS101',
      attendance: 85,
      trend: 'up',
    },
    {
      id: 2,
      name: 'Jane Smith',
      studentId: 'ST002',
      email: 'jane@example.com',
      class: 'CS101',
      attendance: 92,
      trend: 'up',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      studentId: 'ST003',
      email: 'bob@example.com',
      class: 'CS102',
      attendance: 58,
      trend: 'down',
    },
  ]);
  
  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Students
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and track student performance</p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex items-center gap-2">
                  <Download size={18} />
                  <span>Export</span>
                </button>
                <button className="btn-primary flex items-center gap-2">
                  <Mail size={18} />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="card-elevated p-4 mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-primary pl-10"
                  />
                </div>
                <button className="btn-secondary flex items-center gap-2">
                  <Filter size={18} />
                  <span>Filter</span>
                </button>
              </div>
            </div>
            
            {/* Students Table */}
            <div className="card-elevated p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Student</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Student ID</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Class</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Attendance</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{student.studentId}</td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{student.email}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-semibold">
                            {student.class}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getAttendanceColor(student.attendance)}`}>
                              {student.attendance}%
                            </span>
                            {student.trend === 'up' ? (
                              <TrendingUp className="text-green-600" size={16} />
                            ) : (
                              <TrendingDown className="text-red-600" size={16} />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-indigo-600 hover:text-indigo-700 font-semibold">
                            View Details
                          </button>
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
