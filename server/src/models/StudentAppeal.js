import mongoose from 'mongoose';

const studentAppealSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      required: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Appeal reason is required'],
      minlength: 10,
      maxlength: 1000,
    },
    evidence: {
      type: String, // URL to uploaded file or description
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'],
      default: 'PENDING',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: String,
    reviewedAt: Date,
    attachmentUrl: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
studentAppealSchema.index({ student: 1, createdAt: -1 });
studentAppealSchema.index({ status: 1 });
studentAppealSchema.index({ alert: 1 });

const StudentAppeal = mongoose.model('StudentAppeal', studentAppealSchema);

export default StudentAppeal;
