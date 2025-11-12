import mongoose from 'mongoose';

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
      enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    qrSecret: {
      type: String,
      select: false,
    },
    location: {
      room: String,
      building: String,
      latitude: Number,
      longitude: Number,
      radius: {
        type: Number,
        default: 100, // meters
      },
      geofencingEnabled: {
        type: Boolean,
        default: false,
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
