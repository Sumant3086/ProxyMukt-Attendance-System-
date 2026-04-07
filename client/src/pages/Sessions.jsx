import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Clock, Calendar, Users, TrendingUp } from 'lucide-react';

export default function Sessions() {
  const [filter, setFilter] = useState('all');
  
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
                  Sessions
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">View past and upcoming sessions</p>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-8">
              {['all', 'upcoming', 'past', 'live'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filter === tab
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Sessions List */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card-elevated p-6 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Data Structures - Lecture {i}
                        </h3>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>Dec {i}, 2024</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>10:00 AM - 11:30 AM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>38/45 Present (84%)</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-secondary">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
