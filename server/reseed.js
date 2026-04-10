import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';

dotenv.config();

const clearAndReseed = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Dropping all collections...');
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.drop();
      console.log(`   ✓ Dropped ${collection.collectionName}`);
    }
    
    console.log('\n✅ All collections cleared!');
    console.log('🌱 Now run: npm run seed\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearAndReseed();
