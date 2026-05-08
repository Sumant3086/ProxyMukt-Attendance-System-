import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { AlertTriangle, Shield, MapPin, Users, X } from 'lucide-react';

export default function Alerts() {
  const [alerts] = useState([
    {
      id: 1,
      type: 'proxy',
      severity: 'high',
      title: 'Proxy Detection Alert',
      description: 'Student John Doe (ST001) attempted attendance from proxy IP',
      timestamp: new Date(),
      read: false,
    },
    {
      id: 2,
      type: 'location',
      severity: 'medium',
      title: 'Location Spoofing Detected',
      description: 'Suspicious GPS coordinates detected for Jane Smith (ST002)',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: 3,
      type: 'attendance',
      severity: 'low',
      title: 'Low Attendance Warning',
      description: 'CS101 class attendance below 60% threshold',
      timestamp: new Date(Date.now() - 7200000),
      read: true,
    },
  ]);
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-500';
    }
  };
  
  const getIcon = (type) => {
    switch (type) {
      case 'proxy': return Shield;
      case 'location': return MapPin;
      case 'attendance': return Users;
      default: return AlertTriangle;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Security Alerts
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Monitor security and attendance alerts</p>
              </div>
              <button className="btn-secondary self-start sm:self-auto text-sm">
                Mark All as Read
              </button>
            </div>

            {/* Alert Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">High Priority</p>
                    <p className="text-3xl font-bold text-red-600">
                      {alerts.filter(a => a.severity === 'high').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Medium Priority</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {alerts.filter(a => a.severity === 'medium').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <Shield className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Priority</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {alerts.filter(a => a.severity === 'low').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Users className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Alerts List */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Alerts</h2>
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const Icon = getIcon(alert.type);
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 border-l-4 rounded-lg ${getSeverityColor(alert.severity)} ${
                        !alert.read ? 'opacity-100' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <Icon size={20} className="flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold">{alert.title}</h3>
                              {!alert.read && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-sm mb-2">{alert.description}</p>
                            <p className="text-xs opacity-75">
                              {alert.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
