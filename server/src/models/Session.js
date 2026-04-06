import mongoose from 'mongoose';
import { DEFAULT_GEOFENCE_RADIUS, SESSION_STATUS_ENUM } from '../config/constants.js';

const sessionSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty is required'],
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    sessionType: {
      type: String,
      enum: ['OFFLINE', 'ONLINE'],
      default: 'OFFLINE',
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
      default: Date.now,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: SESSION_STATUS_ENUM,
      default: 'SCHEDULED',
    },
    qrSecret: {
      type: String,
      select: false,
    },
    qrEnabled: {
      type: Boolean,
      default: false, // Faculty can enable/disable QR anytime
    },
    // Verification Requirements (Faculty Control)
    verificationRequirements: {
      qrCode: {
        type: Boolean,
        default: true, // QR code always required for offline
      },
      faceVerification: {
        type: Boolean,
        default: false, // Optional: Faculty can enable (liveness only)
      },
      locationVerification: {
        type: Boolean,
        default: false, // Optional: Faculty can enable
      },
      // Future features (not yet implemented)
      facialRecognition: {
        type: Boolean,
        default: false, // Coming soon - requires biometric enrollment
      },
      fingerprintVerification: {
        type: Boolean,
        default: false, // Coming soon - requires biometric enrollment
      },
    },
    location: {
      room: String,
      building: String,
      latitude: Number,
      longitude: Number,
      radius: {
        type: Number,
        default: DEFAULT_GEOFENCE_RADIUS, // meters
      },
      geofencingEnabled: {
        type: Boolean,
        default: false,
      },
      sessionType: {
        type: String,
        enum: ['CLASSROOM', 'EXAM', 'OUTDOOR', 'LAB'],
        default: 'CLASSROOM',
      },
    },
    attendanceCount: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
sessionSchema.index({ class: 1, date: -1 });
sessionSchema.index({ faculty: 1, status: 1 });
sessionSchema.index({ status: 1, startTime: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
