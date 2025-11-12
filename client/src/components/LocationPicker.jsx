import { useState, useEffect } from 'react';
import { MapPin, Target, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LocationPicker({ value, onChange, required = false }) {
  const [location, setLocation] = useState(value || {
    latitude: null,
    longitude: null,
    radius: 100,
    geofencingEnabled: false,
    room: '',
    building: '',
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (onChange) {
      onChange(location);
    }
  }, [location]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          ...location,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      (error) => {
        let errorMsg = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
          default:
            errorMsg = 'An unknown error occurred';
        }
        
        setLocationError(errorMsg);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const clearLocation = () => {
    setLocation({
      ...location,
      latitude: null,
      longitude: null,
    });
  };

  const hasLocation = location.latitude !== null && location.longitude !== null;

  return (
    <div className="space-y-4">
      {/* Geofencing Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <MapPin className="text-indigo-600" size={24} />
          <div>
            <p className="font-medium">Enable Geofencing</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Require students to be at the session location
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={location.geofencingEnabled}
            onChange={(e) => setLocation({ ...location, geofencingEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {location.geofencingEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          {/* Room and Building */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Room Number</label>
              <input
                type="text"
                value={location.room}
                onChange={(e) => setLocation({ ...location, room: e.target.value })}
                placeholder="e.g., 101"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Building</label>
              <input
                type="text"
                value={location.building}
                onChange={(e) => setLocation({ ...location, building: e.target.value })}
                placeholder="e.g., Main Building"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Location Coordinates */}
          <div>
            <label className="block text-sm font-medium mb-2">
              GPS Coordinates {required && <span className="text-red-500">*</span>}
            </label>
            
            {hasLocation ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Check className="text-green-600 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">
                        Location Set
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                        Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900/40 rounded"
                  >
                    <X className="text-green-600" size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Target size={20} />
                <span>{gettingLocation ? 'Getting Location...' : 'Get Current Location'}</span>
              </button>
            )}

            {locationError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {locationError}
              </p>
            )}
          </div>

          {/* Radius Slider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Geofence Radius: {location.radius}m
            </label>
            <input
              type="range"
              min="25"
              max="500"
              step="25"
              value={location.radius}
              onChange={(e) => setLocation({ ...location, radius: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>25m</span>
              <span>250m</span>
              <span>500m</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Students must be within {location.radius} meters to mark attendance
            </p>
          </div>

          {/* Visual Indicator */}
          {hasLocation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <MapPin className="text-blue-600 mt-1" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-blue-800 dark:text-blue-400">
                    Geofencing Active
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                    Students will need to be within {location.radius}m of the session location
                    {location.room && ` (Room ${location.room}`}
                    {location.building && `, ${location.building}`}
                    {location.room && ')'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
