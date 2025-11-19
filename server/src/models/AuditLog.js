import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'REGISTER',
        'CLASS_CREATE',
        'CLASS_UPDATE',
        'CLASS_DELETE',
        'SESSION_CREATE',
        'SESSION_START',
        'SESSION_END',
        'SESSION_UPDATE',
        'SESSION_DELETE',
        'ATTENDANCE_MARK',
        'ATTENDANCE_OVERRIDE',
        'USER_CREATE',
        'USER_UPDATE',
        'USER_DELETE',
        'REPORT_EXPORT',
        'SETTINGS_UPDATE',
      ],
    },
    resource: {
      type: String, // e.g., 'Class', 'Session', 'User'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Store any additional data
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    deviceFingerprint: {
      type: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'WARNING'],
      default: 'SUCCESS',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
