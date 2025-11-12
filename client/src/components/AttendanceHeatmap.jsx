import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AttendanceHeatmap({ data = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate last 90 days
  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = data.find(d => d.date === dateStr);
      
      days.push({
        date: dateStr,
        percentage: dayData?.percentage || 0,
        attended: dayData?.attended || 0,
        total: dayData?.total || 0,
        day: date.getDay(),
        week: Math.floor(i / 7)
      });
    }
    
    return days;
  };

  const days = generateDays();
  const weeks = Math.ceil(days.length / 7);

  const getColor = (percentage) => {
    if (percentage === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (percentage < 50) return 'bg-red-200 dark:bg-red-900/40';
    if (percentage < 75) return 'bg-yellow-200 dark:bg-yellow-900/40';
    if (percentage < 90) return 'bg-green-200 dark:bg-green-900/40';
    return 'bg-green-500 dark:bg-green-600';
  };

  const getIntensity = (percentage) => {
    if (percentage === 0) return 0;
    if (percentage < 50) return 0.3;
    if (percentage < 75) return 0.5;
    if (percentage < 90) return 0.7;
    return 1;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attendance Activity</h3>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-600 dark:text-gray-400">Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/40" />
            <div className="w-3 h-3 rounded-sm bg-yellow-200 dark:bg-yellow-900/40" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
          </div>
          <span className="text-gray-600 dark:text-gray-400">More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-flex space-x-1">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col space-y-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayData = days[weekIndex * 7 + dayIndex];
                if (!dayData) return null;

                return (
                  <motion.div
                    key={dayData.date}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    onHoverStart={() => setHoveredDay(dayData)}
                    onHoverEnd={() => setHoveredDay(null)}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getColor(dayData.percentage)}`}
                    style={{
                      opacity: dayData.percentage === 0 ? 0.3 : getIntensity(dayData.percentage)
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm shadow-xl"
        >
          <p className="font-semibold">{new Date(hoveredDay.date).toLocaleDateString()}</p>
          <p className="text-xs mt-1">
            {hoveredDay.total > 0 
              ? `${hoveredDay.attended}/${hoveredDay.total} sessions (${hoveredDay.percentage}%)`
              : 'No sessions'
            }
          </p>
        </motion.div>
      )}
    </div>
  );
}
