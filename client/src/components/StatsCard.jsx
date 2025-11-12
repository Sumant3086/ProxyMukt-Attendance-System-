import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import CountUpAnimation from './CountUpAnimation';
import { TrendingUp } from 'lucide-react';

export default function StatsCard({ icon: Icon, title, value, subtitle, color = 'blue', delay = 0, trend }) {
  const colorClasses = {
    blue: 'from-indigo-500 to-indigo-600',      // Professional indigo
    green: 'from-green-500 to-green-600',       // Success green
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',    // Accent orange
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
  };

  const numericValue = typeof value === 'string' ? parseInt(value) : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <GlassCard className="p-6 relative overflow-hidden group">
        {/* Animated gradient background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-10`}
          animate={{
            opacity: [0, 0.05, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg group-hover:shadow-2xl transition-shadow`}
            >
              <Icon className="text-white" size={24} />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <span>Live</span>
            </motion.div>
          </div>
          
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </h3>
          
          <div className="flex items-end justify-between mb-2">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring', stiffness: 150 }}
              className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            >
              {!isNaN(numericValue) ? (
                <CountUpAnimation value={numericValue} />
              ) : (
                value
              )}
            </motion.p>
            
            {trend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.4 }}
                className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm font-semibold"
              >
                <TrendingUp size={16} />
                <span>+{trend}%</span>
              </motion.div>
            )}
          </div>
          
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5 }}
              className="text-xs text-gray-500 dark:text-gray-400"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
