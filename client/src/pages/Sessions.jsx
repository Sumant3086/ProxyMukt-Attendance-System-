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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sessions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">View past and upcoming sessions</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
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
                <div key={i} className="card-elevated p-4 sm:p-6 hover-lift">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                          Data Structures - Lecture {i}
                        </h3>
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>Dec {i}, 2024</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>10:00 AM - 11:30 AM</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={14} />
                          <span>38/45 Present (84%)</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-secondary text-sm py-2 self-start sm:self-auto">
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
