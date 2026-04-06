import mongoose from 'mongoose';

const ipWhitelistSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: [true, 'IP address is required'],
      unique: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ['WHITELIST', 'BLACKLIST'],
      default: 'WHITELIST',
    },
    reason: {
      type: String,
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (ip already has unique index from schema definition)
ipWhitelistSchema.index({ type: 1 });
ipWhitelistSchema.index({ student: 1 });
ipWhitelistSchema.index({ expiresAt: 1 });
ipWhitelistSchema.index({ isActive: 1 });

const IPWhitelist = mongoose.model('IPWhitelist', ipWhitelistSchema);

export default IPWhitelist;
