import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskFactors: [
      {
        type: String,
        enum: [
          'PROXY_DETECTED',
          'VPN_DETECTED',
          'TOR_DETECTED',
          'RESIDENTIAL_PROXY',
          'DATACENTER_IP',
          'IMPOSSIBLE_TRAVEL',
          'SUSPICIOUS_DEVICE',
          'LOCATION_SPOOFING',
          'SHARED_DEVICE',
          'UNUSUAL_TIME',
        ],
      },
    ],
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    deviceInfo: {
      ip: String,
      userAgent: String,
      browser: String,
      os: String,
      deviceFingerprint: String,
    },
    locationInfo: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewNotes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
alertSchema.index({ student: 1, createdAt: -1 });
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ riskScore: -1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ session: 1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
