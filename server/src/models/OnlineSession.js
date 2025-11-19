import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinTime: {
    type: Date,
    required: true,
  },
  leaveTime: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    default: 0,
  },
  cameraStatus: {
    type: String,
    enum: ['ON', 'OFF', 'PARTIAL'],
    default: 'OFF',
  },
  micStatus: {
    type: String,
    enum: ['ON', 'OFF', 'PARTIAL'],
    default: 'OFF',
  },
  engagementScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  tabSwitches: {
    type: Number,
    default: 0,
  },
  chatMessages: {
    type: Number,
    default: 0,
  },
  attentionTime: {
    type: Number, // minutes actively watching
    default: 0,
  },
});

const onlineSessionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    platform: {
      type: String,
      enum: ['ZOOM', 'GOOGLE_MEET', 'TEAMS', 'WEBRTC'],
      required: true,
    },
    meetingId: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
    meetingPassword: {
      type: String,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
    },
    participants: [participantSchema],
    recordingUrl: {
      type: String,
    },
    isRecording: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
onlineSessionSchema.index({ session: 1 });
onlineSessionSchema.index({ meetingId: 1 });
onlineSessionSchema.index({ 'participants.student': 1 });

const OnlineSession = mongoose.model('OnlineSession', onlineSessionSchema);

export default OnlineSession;
