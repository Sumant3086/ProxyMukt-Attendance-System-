import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Class from './src/models/Class.js';
import Session from './src/models/Session.js';
import Attendance from './src/models/Attendance.js';
import Notification from './src/models/Notification.js';
import Alert from './src/models/Alert.js';
import VerificationQueue from './src/models/VerificationQueue.js';
import connectDB from './src/config/db.js';

dotenv.config();

const clearDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing all collections...');
    
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Session.deleteMany({}),
      Attendance.deleteMany({}),
      Notification.deleteMany({}),
      Alert.deleteMany({}),
      VerificationQueue.deleteMany({})
    ]);

    console.log('✅ Database cleared successfully!');
    console.log('💡 Now run: npm run seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();
