import mongoose from 'mongoose';
import { ATTENDANCE_STATUS, ATTENDANCE_SOURCE_ENUM } from '../config/constants.js';

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
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
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
      enum: ATTENDANCE_SOURCE_ENUM,
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

// Performance indexes for queries
attendanceSchema.index({ 'deviceInfo.ip': 1 });
attendanceSchema.index({ 'deviceInfo.riskScore': 1 });
attendanceSchema.index({ 'location.verified': 1 });
attendanceSchema.index({ createdAt: -1 });
attendanceSchema.index({ class: 1, createdAt: -1 });
attendanceSchema.index({ 'deviceInfo.isProxy': 1 });
attendanceSchema.index({ status: 1, createdAt: -1 });

// FANG-LEVEL: Compound indexes for complex queries
attendanceSchema.index({ class: 1, student: 1, createdAt: -1 }); // Class attendance history
attendanceSchema.index({ session: 1, 'deviceInfo.riskScore': -1 }); // High-risk attendances per session
attendanceSchema.index({ student: 1, 'deviceInfo.ip': 1, createdAt: -1 }); // IP tracking per student
attendanceSchema.index({ 'location.verified': 1, 'deviceInfo.riskScore': -1 }); // Suspicious locations
attendanceSchema.index({ class: 1, status: 1, createdAt: -1 }); // Class status reports
attendanceSchema.index({ 'deviceInfo.deviceFingerprint': 1, student: 1 }); // Device tracking

// Sparse indexes (only index documents with the field)
attendanceSchema.index({ 'onlineSessionData.joinTime': 1 }, { sparse: true });
attendanceSchema.index({ 'location.suspicious': 1 }, { sparse: true, partialFilterExpression: { 'location.suspicious': true } });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
