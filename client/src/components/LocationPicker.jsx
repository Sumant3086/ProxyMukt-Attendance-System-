import { useState, useEffect } from 'react';
import { MapPin, Target, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LocationPicker({ value, onChange, required = false }) {
  const [location, setLocation] = useState(value || {
    latitude: null,
    longitude: null,
    radius: 100,
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
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4 pt-4 border-t border-gray-700"
    >
      {/* Room and Building */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">Room Number</label>
          <input
            type="text"
            value={location.room}
            onChange={(e) => setLocation({ ...location, room: e.target.value })}
            placeholder="e.g., 101"
            className="w-full px-4 py-3 bg-[#0f1420] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">Building</label>
          <input
            type="text"
            value={location.building}
            onChange={(e) => setLocation({ ...location, building: e.target.value })}
            placeholder="e.g., Main Building"
            className="w-full px-4 py-3 bg-[#0f1420] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Location Coordinates */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-300">
          GPS Coordinates {required && <span className="text-red-500">*</span>}
        </label>
        
        {hasLocation ? (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Check className="text-green-400 mt-1" size={20} />
                <div>
                  <p className="font-medium text-green-300">
                    Location Set
                  </p>
                  <p className="text-sm text-green-400 mt-1">
                    Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearLocation}
                className="p-1 hover:bg-green-900/40 rounded transition-colors"
              >
                <X className="text-green-400" size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Target size={20} />
            <span>{gettingLocation ? 'Getting Location...' : '🎯 Get Current Location'}</span>
          </button>
        )}

        {locationError && (
          <p className="text-sm text-red-400 mt-2">
            {locationError}
          </p>
        )}
      </div>

      {/* Radius Slider */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-300">
          Geofence Radius: {location.radius}m
        </label>
        <input
          type="range"
          min="25"
          max="500"
          step="25"
          value={location.radius}
          onChange={(e) => setLocation({ ...location, radius: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
          style={{
            background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${((location.radius - 25) / 475) * 100}%, rgb(55, 65, 81) ${((location.radius - 25) / 475) * 100}%, rgb(55, 65, 81) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>25m</span>
          <span>250m</span>
          <span>500m</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Students must be within {location.radius} meters to mark attendance
        </p>
      </div>

      {/* Visual Indicator */}
      {hasLocation && (
        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-xl">
          <div className="flex items-start space-x-3">
            <MapPin className="text-blue-400 mt-1" size={20} />
            <div className="flex-1">
              <p className="font-medium text-blue-300">
                Geofencing Active
              </p>
              <p className="text-sm text-blue-400 mt-1">
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
  );
}
