import mongoose from 'mongoose';

const rateLimitSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    lastAttempt: {
      type: Date,
      default: Date.now,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: String,
    blockUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
rateLimitSchema.index({ student: 1, endpoint: 1 });
rateLimitSchema.index({ ip: 1, endpoint: 1 });
rateLimitSchema.index({ isBlocked: 1 });
rateLimitSchema.index({ blockUntil: 1 });

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

export default RateLimit;
