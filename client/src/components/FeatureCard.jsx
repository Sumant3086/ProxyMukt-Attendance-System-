import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

export default function FeatureCard({ icon: Icon, title, description, color = 'indigo', delay = 0 }) {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    pink: 'from-pink-500 to-pink-600',
  };
  
  const glowClasses = {
    indigo: 'group-hover:shadow-indigo-500/50',
    purple: 'group-hover:shadow-purple-500/50',
    blue: 'group-hover:shadow-blue-500/50',
    green: 'group-hover:shadow-green-500/50',
    yellow: 'group-hover:shadow-yellow-500/50',
    pink: 'group-hover:shadow-pink-500/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10 }}
    >
      <GlassCard className="p-6 h-full group cursor-pointer" glow>
        <div className="relative">
          {/* Animated Icon Container */}
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4 shadow-lg ${glowClasses[color]} transition-all duration-300 relative overflow-hidden`}
          >
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer" />
            <Icon className="text-white relative z-10" size={32} />
          </motion.div>
          
          {/* Title with Gradient */}
          <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            {description}
          </p>
          
          {/* Animated Progress Bar */}
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '30%' }}
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.5 }}
            className={`h-1 bg-gradient-to-r ${colorClasses[color]} rounded-full`}
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}
