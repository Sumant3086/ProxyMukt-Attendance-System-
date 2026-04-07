import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Users, UserPlus, Upload, Download, Edit, Trash2, Lock, Unlock } from 'lucide-react';

export default function UserManagement() {
  const [users] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'STUDENT', status: 'active', lastLogin: '2024-12-20' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'FACULTY', status: 'active', lastLogin: '2024-12-19' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'STUDENT', status: 'inactive', lastLogin: '2024-12-10' },
  ]);
  
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
                  User Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Manage users, roles, and permissions</p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex items-center gap-2">
                  <Upload size={18} />
                  <span>Bulk Import</span>
                </button>
                <button className="btn-primary flex items-center gap-2">
                  <UserPlus size={18} />
                  <span>Add User</span>
                </button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card-elevated p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">1,234</p>
              </div>
              <div className="card-elevated p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Students</p>
                <p className="text-3xl font-bold text-indigo-600">1,000</p>
              </div>
              <div className="card-elevated p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Faculty</p>
                <p className="text-3xl font-bold text-purple-600">200</p>
              </div>
              <div className="card-elevated p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admins</p>
                <p className="text-3xl font-bold text-green-600">34</p>
              </div>
            </div>
            
            {/* Users Table */}
            <div className="card-elevated p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">User</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Last Login</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-semibold">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            user.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.lastLogin}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                              <Edit size={16} className="text-indigo-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                              {user.status === 'active' ? (
                                <Lock size={16} className="text-yellow-600" />
                              ) : (
                                <Unlock size={16} className="text-green-600" />
                              )}
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
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
