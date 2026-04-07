import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Target, Flame, Trophy, TrendingUp, Calendar, Award } from 'lucide-react';

export default function AttendanceGoals() {
  const [currentStreak, setCurrentStreak] = useState(12);
  const [longestStreak, setLongestStreak] = useState(28);
  const [goal, setGoal] = useState(90);
  const [currentAttendance, setCurrentAttendance] = useState(87);
  
  const achievements = [
    { id: 1, title: '7 Day Streak', icon: '🔥', unlocked: true },
    { id: 2, title: '30 Day Streak', icon: '⚡', unlocked: false },
    { id: 3, title: '90% Attendance', icon: '🎯', unlocked: false },
    { id: 4, title: 'Perfect Month', icon: '🏆', unlocked: true },
    { id: 5, title: '100 Classes', icon: '💯', unlocked: true },
    { id: 6, title: 'Early Bird', icon: '🌅', unlocked: false },
  ];
  
  const progressToGoal = (currentAttendance / goal) * 100;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Attendance Goals & Streaks
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Track your progress and earn achievements</p>
            </div>
            
            {/* Streak Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card-elevated p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Flame size={32} />
                  <h3 className="text-lg font-semibold">Current Streak</h3>
                </div>
                <p className="text-5xl font-bold mb-2">{currentStreak}</p>
                <p className="text-sm opacity-90">consecutive days present</p>
              </div>
              
              <div className="card-elevated p-6 bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy size={32} />
                  <h3 className="text-lg font-semibold">Longest Streak</h3>
                </div>
                <p className="text-5xl font-bold mb-2">{longestStreak}</p>
                <p className="text-sm opacity-90">days - Personal best!</p>
              </div>
              
              <div className="card-elevated p-6 bg-gradient-to-br from-green-500 to-teal-500 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Target size={32} />
                  <h3 className="text-lg font-semibold">Goal Progress</h3>
                </div>
                <p className="text-5xl font-bold mb-2">{currentAttendance}%</p>
                <p className="text-sm opacity-90">Target: {goal}%</p>
              </div>
            </div>
            
            {/* Set Goal */}
            <div className="card-elevated p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Set Your Attendance Goal</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Target Attendance: {goal}%
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>60%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">Progress to Goal</span>
                    <span className="font-bold text-indigo-600">{progressToGoal.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressToGoal, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {currentAttendance >= goal
                      ? '🎉 Congratulations! You\'ve reached your goal!'
                      : `You need ${(goal - currentAttendance).toFixed(1)}% more to reach your goal`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Achievements */}
            <div className="card-elevated p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg text-center transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-50'
                    }`}
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <p className="text-xs font-semibold">{achievement.title}</p>
                    {achievement.unlocked && (
                      <div className="mt-2">
                        <Award size={16} className="mx-auto" />
                      </div>
                    )}
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
