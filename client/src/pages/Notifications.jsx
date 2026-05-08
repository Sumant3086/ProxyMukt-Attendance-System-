import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Attendance Marked Successfully',
      message: 'Your attendance for CS101 has been marked successfully.',
      timestamp: new Date(),
      read: false,
      type: 'success',
    },
    {
      id: 2,
      title: 'New Session Started',
      message: 'Prof. Smith has started a new session for CS102.',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      type: 'info',
    },
    {
      id: 3,
      title: 'Low Attendance Warning',
      message: 'Your attendance is below 75%. Please attend classes regularly.',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      type: 'warning',
    },
  ]);
  
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 dark:bg-green-900/20 border-green-500';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500';
      case 'error': return 'bg-red-100 dark:bg-red-900/20 border-red-500';
      default: return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  {notifications.filter(n => !n.read).length} unread notifications
                </p>
              </div>
              <button
                onClick={markAllAsRead}
                className="btn-secondary flex items-center gap-2 self-start sm:self-auto text-sm"
              >
                <CheckCheck size={16} />
                <span>Mark All as Read</span>
              </button>
            </div>
            
            {/* Notifications List */}
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 rounded-lg ${getTypeColor(notification.type)} ${
                      !notification.read ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check size={18} className="text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
