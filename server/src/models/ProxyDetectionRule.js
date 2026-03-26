import mongoose from 'mongoose';

const proxyDetectionRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      unique: true,
    },
    description: String,
    ruleType: {
      type: String,
      enum: ['PROXY_SCORE', 'IP_REPUTATION', 'DEVICE_FINGERPRINT', 'BEHAVIORAL', 'GEOLOCATION'],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    action: {
      type: String,
      enum: ['ALERT', 'BLOCK', 'REQUIRE_VERIFICATION', 'LOG'],
      default: 'ALERT',
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed, // Flexible conditions object
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
proxyDetectionRuleSchema.index({ enabled: 1, priority: -1 });
proxyDetectionRuleSchema.index({ ruleType: 1 });

const ProxyDetectionRule = mongoose.model('ProxyDetectionRule', proxyDetectionRuleSchema);

export default ProxyDetectionRule;
