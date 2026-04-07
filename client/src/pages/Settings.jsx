import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Settings as SettingsIcon, User, Bell, Lock, Palette } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Tabs */}
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Content */}
              <div className="md:col-span-3 card-elevated p-6">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          Full Name
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.name}
                          className="input-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue={user?.email}
                          className="input-primary"
                        />
                      </div>
                      <button className="btn-primary">Save Changes</button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
                    <div className="space-y-4">
                      {['Email Notifications', 'Push Notifications', 'SMS Alerts'].map((item) => (
                        <label key={item} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                          <span className="font-semibold text-gray-900 dark:text-white">{item}</span>
                          <input type="checkbox" defaultChecked className="w-5 h-5" />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          Current Password
                        </label>
                        <input type="password" className="input-primary" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          New Password
                        </label>
                        <input type="password" className="input-primary" />
                      </div>
                      <button className="btn-primary">Update Password</button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h2>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                        <span className="font-semibold text-gray-900 dark:text-white">Dark Mode</span>
                        <input type="checkbox" className="w-5 h-5" />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
