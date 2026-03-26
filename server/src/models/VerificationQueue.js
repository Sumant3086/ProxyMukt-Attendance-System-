import mongoose from 'mongoose';

const verificationQueueSchema = new mongoose.Schema(
  {
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      required: true,
      unique: true,
    },
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
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['QUEUED', 'IN_REVIEW', 'RESOLVED', 'ESCALATED'],
      default: 'QUEUED',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'MANUAL_OVERRIDE', 'ESCALATED'],
    },
    resolutionNotes: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
verificationQueueSchema.index({ status: 1, priority: -1 });
verificationQueueSchema.index({ student: 1 });
verificationQueueSchema.index({ assignedTo: 1, status: 1 });
verificationQueueSchema.index({ createdAt: -1 });

const VerificationQueue = mongoose.model('VerificationQueue', verificationQueueSchema);

export default VerificationQueue;
