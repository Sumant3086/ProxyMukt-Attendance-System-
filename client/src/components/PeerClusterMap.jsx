import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, AlertTriangle, Navigation, TrendingUp } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

export default function PeerClusterMap({ sessionId }) {
  const [clusterData, setClusterData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchClusterData();
    }
  }, [sessionId]);

  const fetchClusterData = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/attendance/peer-cluster/${sessionId}`);
      setClusterData(data.data);
    } catch (error) {
      console.error('Error fetching cluster data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!clusterData || !clusterData.validationPossible) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="text-gray-400" size={24} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Peer Location Analysis
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>Not enough students for peer validation</p>
          <p className="text-sm mt-1">
            Need at least 5 students ({clusterData?.totalStudents || 0}/5)
          </p>
        </div>
      </div>
    );
  }

  const { averageLocation, totalStudents, outliers } = clusterData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <MapPin className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Peer Location Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time attendance location clustering
            </p>
          </div>
        </div>
        <button
          onClick={fetchClusterData}
          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalStudents}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">In Cluster</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalStudents - outliers.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Outliers</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{outliers.length}</p>
        </div>
      </div>

      {/* Cluster Center */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Navigation size={18} className="text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-gray-800 dark:text-white">Cluster Center</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Latitude:</span>
            <p className="font-mono text-gray-800 dark:text-white">
              {averageLocation.latitude.toFixed(6)}
            </p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Longitude:</span>
            <p className="font-mono text-gray-800 dark:text-white">
              {averageLocation.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Representation */}
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-gray-700">
        {/* Cluster center */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            {/* Radius circle */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-400/20 dark:bg-blue-600/20 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-400/30 dark:bg-blue-600/30 rounded-full"
            />
            
            {/* Center marker */}
            <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <MapPin size={24} className="text-white" />
            </div>
          </div>
        </motion.div>

        {/* Students in cluster */}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalStudents - outliers.length} students in range
            </span>
          </div>
        </div>

        {/* Outliers indicator */}
        {outliers.length > 0 && (
          <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-white" />
              <span className="text-sm font-medium text-white">
                {outliers.length} outlier{outliers.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Cluster center</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Within 500m</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Outlier (500m+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outliers List */}
      {outliers.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-800 dark:text-red-400">
              Suspicious Locations Detected
            </h4>
          </div>
          <div className="space-y-2">
            {outliers.map((outlier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <MapPin size={16} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      Student ID: {outlier.studentId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(outlier.distance)}m from cluster center
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                  Outlier
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No outliers message */}
      {outliers.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingUp size={18} />
            <p className="text-sm font-medium">
              All students are within expected range. No suspicious locations detected.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
