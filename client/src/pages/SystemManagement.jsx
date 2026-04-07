import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Server, Database, Activity, HardDrive, Cpu, Shield, Settings as SettingsIcon, Download } from 'lucide-react';

export default function SystemManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const tabs = [
    { id: 'dashboard', label: 'System Dashboard', icon: Server },
    { id: 'security', label: 'Security Center', icon: Shield },
    { id: 'config', label: 'Configuration', icon: SettingsIcon },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                System Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor and configure system settings</p>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            {/* System Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Activity className="text-green-600" size={32} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">234</p>
                  </div>
                  
                  <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Cpu className="text-blue-600" size={32} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CPU Usage</p>
                    <p className="text-3xl font-bold text-blue-600">45%</p>
                  </div>
                  
                  <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                      <HardDrive className="text-purple-600" size={32} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Storage Used</p>
                    <p className="text-3xl font-bold text-purple-600">67%</p>
                  </div>
                  
                  <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Database className="text-indigo-600" size={32} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">DB Size</p>
                    <p className="text-3xl font-bold text-indigo-600">2.4GB</p>
                  </div>
                </div>
                
                <div className="card-elevated p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">API Response Times</h3>
                  <div className="space-y-3">
                    {[
                      { endpoint: '/api/sessions', time: '45ms', status: 'good' },
                      { endpoint: '/api/attendance', time: '120ms', status: 'good' },
                      { endpoint: '/api/analytics', time: '280ms', status: 'warning' },
                    ].map((api, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">{api.endpoint}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          api.status === 'good' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {api.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Security Center */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card-elevated p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">IP Whitelist Management</h3>
                  <button className="btn-primary mb-4">Add IP Address</button>
                  <div className="space-y-2">
                    {['192.168.1.1', '10.0.0.1'].map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-mono text-gray-900 dark:text-white">{ip}</span>
                        <button className="text-red-600 hover:text-red-700">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="card-elevated p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Failed Login Attempts</h3>
                  <p className="text-3xl font-bold text-red-600 mb-2">12</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">in the last 24 hours</p>
                </div>
              </div>
            )}
            
            {/* Configuration */}
            {activeTab === 'config' && (
              <div className="card-elevated p-6">
                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">System Configuration</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Attendance Threshold (%)
                    </label>
                    <input type="number" defaultValue="75" className="input-primary" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Default Geofencing Radius (meters)
                    </label>
                    <input type="number" defaultValue="100" className="input-primary" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      QR Code Rotation Interval (seconds)
                    </label>
                    <input type="number" defaultValue="20" className="input-primary" />
                  </div>
                  
                  <button className="btn-primary">Save Configuration</button>
                </div>
              </div>
            )}
            
            {/* Backup & Restore */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div className="card-elevated p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Database Backup</h3>
                  <button className="btn-primary flex items-center gap-2">
                    <Download size={18} />
                    <span>Create Backup</span>
                  </button>
                </div>
                
                <div className="card-elevated p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Backups</h3>
                  <div className="space-y-2">
                    {['2024-12-20', '2024-12-19', '2024-12-18'].map((date, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">Backup - {date}</span>
                        <div className="flex gap-2">
                          <button className="text-indigo-600 hover:text-indigo-700">Download</button>
                          <button className="text-green-600 hover:text-green-700">Restore</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
