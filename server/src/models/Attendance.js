import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE'],
      default: 'PRESENT',
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    qrToken: {
      type: String,
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      deviceFingerprint: String,
      browser: String,
      os: String,
      platform: String,
      isProxy: Boolean,
      isVPN: Boolean,
      isTor: Boolean,
      riskScore: Number,
    },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      verified: Boolean,
      distance: Number, // Distance from session location in meters
      suspicious: Boolean, // Flag for suspicious location data
    },
    attendanceSource: {
      type: String,
      enum: ['QR', 'FACE', 'ZOOM', 'GOOGLE_MEET', 'TEAMS', 'WEBRTC'],
      default: 'QR',
    },
    onlineSessionData: {
      joinTime: Date,
      leaveTime: Date,
      duration: Number, // minutes
      engagementScore: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceSchema.index({ class: 1, student: 1 });
attendanceSchema.index({ student: 1, createdAt: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
