import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Video, Clock, Calendar, ExternalLink } from 'lucide-react';
import GlassCard from './GlassCard';

const CreateZoomMeeting = ({ sessionId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    duration: 60,
  });
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('/api/zoom/create', {
        sessionId,
        topic: formData.topic,
        duration: formData.duration,
      });

      setResult(data.data);
      if (onSuccess) onSuccess(data.data);
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      alert(error.response?.data?.message || 'Failed to create Zoom meeting');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Zoom Meeting Created!</h3>
          <p className="text-gray-300 mb-6">Your Zoom meeting is ready</p>

          <div className="space-y-4 text-left bg-white/5 rounded-lg p-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Meeting ID</p>
              <p className="text-white font-mono">{result.zoomMeeting.meetingId}</p>
            </div>
            {result.zoomMeeting.meetingPassword && (
              <div>
                <p className="text-gray-400 text-sm">Password</p>
                <p className="text-white font-mono">{result.zoomMeeting.meetingPassword}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-sm">Join Link (for students)</p>
              <a
                href={result.zoomMeeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all flex items-center gap-2"
              >
                {result.zoomMeeting.meetingLink}
                <ExternalLink size={14} />
              </a>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Start Link (for you)</p>
              <a
                href={result.zoomMeeting.startUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline break-all flex items-center gap-2"
              >
                Click to start meeting
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={result.zoomMeeting.startUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Start Meeting
            </a>
            <a
              href={`/online-session-monitor/${result.onlineSession._id}`}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Monitor Session
            </a>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
          <Video className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Create Zoom Meeting</h3>
          <p className="text-gray-400 text-sm">Automatically track attendance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white font-semibold mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Meeting Topic
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="e.g., Data Structures Lecture"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            min="15"
            max="240"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Meeting...' : 'Create Zoom Meeting'}
        </motion.button>
      </form>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-400 text-sm">
          <strong>Note:</strong> This will create a Zoom meeting and automatically track attendance
          based on join/leave times. Students must join with their registered email addresses.
        </p>
      </div>
    </GlassCard>
  );
};

export default CreateZoomMeeting;
