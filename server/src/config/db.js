import mongoose from 'mongoose';

/**
 * Connect to MongoDB database with retry logic and production-grade pool settings
 */
const connectDB = async (retries = 5, delay = 5000) => {
  // Validate MongoDB URI exists
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    console.error('💡 Please set MONGODB_URI in your .env file');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // FANG-LEVEL: Production-grade connection pool settings
        maxPoolSize: 100,              // Maximum connections (up from default 10)
        minPoolSize: 10,               // Minimum connections to maintain
        maxIdleTimeMS: 30000,          // Close idle connections after 30s
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,                     // Use IPv4, skip trying IPv6
        
        // Connection retry settings
        retryWrites: true,
        retryReads: true,
        
        // Compression for better network performance
        compressors: ['zlib'],
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Connection Pool: maxPoolSize=${100}, minPoolSize=${10}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });
      
      // Monitor connection pool
      mongoose.connection.on('open', () => {
        console.log('📡 MongoDB connection pool opened');
      });
      
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${attempt}/${retries} Failed: ${error.message}`);
      
      if (attempt === retries) {
        console.error('❌ All MongoDB connection attempts failed.');
        console.error('💡 Please check:');
        console.error('   1. MongoDB is running');
        console.error('   2. MONGODB_URI is correct in .env file');
        console.error('   3. Network connection is stable');
        console.error('   4. MongoDB Atlas IP whitelist (if using Atlas)');
        process.exit(1);
      }
      
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 1.5;
    }
  }
};

export default connectDB;
