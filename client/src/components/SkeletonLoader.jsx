import { motion } from 'framer-motion';

export function SkeletonCard({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`}
    />
  );
}

export function SkeletonText({ className = '', lines = 1 }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="h-32 p-6">
            <div className="space-y-3">
              <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <SkeletonCard key={i} className="h-96 p-6">
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
