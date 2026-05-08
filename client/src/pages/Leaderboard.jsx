import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const [filter, setFilter] = useState('class');
  
  const leaderboard = [
    { rank: 1, name: 'Alice Johnson', attendance: 98, classes: 'CS101', trend: '+2' },
    { rank: 2, name: 'Bob Smith', attendance: 96, classes: 'CS101', trend: '+1' },
    { rank: 3, name: 'Charlie Brown', attendance: 94, classes: 'CS101', trend: '0' },
    { rank: 4, name: 'Diana Prince', attendance: 92, classes: 'CS101', trend: '-1' },
    { rank: 5, name: 'You', attendance: 87, classes: 'CS101', trend: '+3', isCurrentUser: true },
  ];
  
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Medal className="text-orange-600" size={24} />;
    return <span className="text-gray-600 dark:text-gray-400 font-bold">{rank}</span>;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Attendance Leaderboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">See how you rank among your peers</p>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
              {['class', 'department', 'university'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Top 3 Podium — single column on mobile, 3-col on md+ */}
            <div className="hidden sm:grid grid-cols-3 gap-4 mb-6 sm:mb-8">
              {leaderboard.slice(0, 3).map((student, index) => (
                <div
                  key={student.rank}
                  className={`card-elevated p-4 sm:p-6 text-center ${
                    index === 0 ? 'md:order-2 transform md:scale-105' : index === 1 ? 'md:order-1' : 'md:order-3'
                  }`}
                >
                  <div className="mb-3">{getRankIcon(student.rank)}</div>
                  <p className="font-bold text-sm sm:text-lg text-gray-900 dark:text-white mb-1 truncate">{student.name}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-1">{student.attendance}%</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{student.classes}</p>
                </div>
              ))}
            </div>
            {/* Mobile: show top 3 as list items instead of podium */}
            <div className="sm:hidden space-y-3 mb-6">
              {leaderboard.slice(0, 3).map((student) => (
                <div key={student.rank} className="card-elevated p-4 flex items-center gap-4">
                  <div className="w-10 flex justify-center">{getRankIcon(student.rank)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.classes}</p>
                  </div>
                  <p className="text-xl font-bold text-indigo-600">{student.attendance}%</p>
                </div>
              ))}
            </div>
            
            {/* Full Leaderboard */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Full Rankings</h2>
              <div className="space-y-2">
                {leaderboard.map((student) => (
                  <div
                    key={student.rank}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      student.isCurrentUser
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 text-center">{getRankIcon(student.rank)}</div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {student.name}
                          {student.isCurrentUser && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.classes}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.attendance}%</p>
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp size={14} className={student.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'} />
                          <span className={student.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                            {student.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
