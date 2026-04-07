import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Megaphone, Plus, Pin, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Announcements() {
  const { user } = useAuthStore();
  const isFacultyOrAdmin = user?.role === 'FACULTY' || user?.role === 'ADMIN';
  
  const [announcements] = useState([
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      content: 'The attendance system will undergo maintenance on Dec 25, 2024 from 2:00 AM to 4:00 AM.',
      author: 'Admin',
      date: new Date(),
      pinned: true,
      type: 'system',
    },
    {
      id: 2,
      title: 'New Face Verification Feature',
      content: 'We have added face liveness detection to enhance security. Please ensure good lighting when marking attendance.',
      author: 'Admin',
      date: new Date(Date.now() - 86400000),
      pinned: false,
      type: 'feature',
    },
    {
      id: 3,
      title: 'CS101 - Extra Class Tomorrow',
      content: 'There will be an extra class tomorrow at 3:00 PM in Room 204.',
      author: 'Prof. Smith',
      date: new Date(Date.now() - 172800000),
      pinned: false,
      type: 'class',
    },
  ]);
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'system': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'feature': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'class': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Announcements
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Stay updated with important announcements</p>
              </div>
              {isFacultyOrAdmin && (
                <button className="btn-primary flex items-center gap-2">
                  <Plus size={18} />
                  <span>New Announcement</span>
                </button>
              )}
            </div>
            
            {/* Announcements List */}
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`card-elevated p-6 ${announcement.pinned ? 'border-2 border-indigo-500' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {announcement.pinned && (
                        <Pin className="text-indigo-600" size={20} />
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(announcement.type)}`}>
                        {announcement.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar size={16} />
                      <span>{announcement.date.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {announcement.content}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Posted by <span className="font-semibold">{announcement.author}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
