import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import voiceAnnouncer from '../utils/voiceAnnouncements';

export default function VoiceToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(voiceAnnouncer.isEnabled());
  }, []);

  const handleToggle = () => {
    const newState = voiceAnnouncer.toggle();
    setEnabled(newState);
    
    if (newState) {
      voiceAnnouncer.speak('Voice announcements enabled');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={`p-2.5 rounded-xl transition-all duration-300 ${
        enabled
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}
      title={enabled ? 'Disable voice announcements' : 'Enable voice announcements'}
    >
      {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </motion.button>
  );
}
