import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Zap } from 'lucide-react';
import GlassCard from './GlassCard';

export default function StreakCounter({ currentStreak = 0, longestStreak = 0, totalDays = 0 }) {
  const getStreakLevel = (streak) => {
    if (streak >= 30) return { level: 'Legendary', color: 'from-yellow-500 to-orange-500', icon: Trophy };
    if (streak >= 14) return { level: 'Master', color: 'from-purple-500 to-pink-500', icon: Zap };
    if (streak >= 7) return { level: 'Pro', color: 'from-blue-500 to-indigo-500', icon: Target };
    return { level: 'Beginner', color: 'from-green-500 to-emerald-500', icon: Flame };
  };

  const streakInfo = getStreakLevel(currentStreak);
  const StreakIcon = streakInfo.icon;

  return (
    <GlassCard className="p-6" glow>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Attendance Streak</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Keep it going! 🎯</p>
        </div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${streakInfo.color} flex items-center justify-center shadow-lg`}
        >
          <StreakIcon className="text-white" size={32} />
        </motion.div>
      </div>

      {/* Current Streak */}
      <div className="mb-6">
        <div className="flex items-end space-x-2 mb-2">
          <motion.span
            key={currentStreak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-5xl font-bold bg-gradient-to-r ${streakInfo.color} bg-clip-text text-transparent`}
          >
            {currentStreak}
          </motion.span>
          <span className="text-2xl text-gray-600 dark:text-gray-400 mb-2">days</span>
        </div>
        <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${streakInfo.color} text-white text-sm font-semibold`}>
          {streakInfo.level} Level
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress to next level</span>
          <span>{currentStreak % 7}/7 days</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStreak % 7) / 7) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${streakInfo.color}`}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
          <Flame className="mx-auto mb-2 text-orange-500" size={24} />
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{longestStreak}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Longest Streak</p>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
          <Trophy className="mx-auto mb-2 text-yellow-500" size={24} />
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalDays}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Days</p>
        </div>
      </div>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-200 dark:border-indigo-800"
      >
        <p className="text-sm text-center text-gray-700 dark:text-gray-300">
          {currentStreak === 0 && "Start your streak today! 🚀"}
          {currentStreak > 0 && currentStreak < 7 && "Great start! Keep going! 💪"}
          {currentStreak >= 7 && currentStreak < 14 && "You're on fire! 🔥"}
          {currentStreak >= 14 && currentStreak < 30 && "Incredible dedication! 🌟"}
          {currentStreak >= 30 && "You're a legend! 👑"}
        </p>
      </motion.div>
    </GlassCard>
  );
}
