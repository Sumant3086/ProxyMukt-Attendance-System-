import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Class from './src/models/Class.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Class.deleteMany({});
    
    console.log('Creating users...');
    
    // Create owner/admin (Sumant Yadav)
    const admin = await User.create({
      name: 'Sumant Yadav',
      email: 'sumantyadav3086@gmail.com',
      password: 'admin123',
      role: 'ADMIN',
      department: 'Administration',
    });
    
    // Create faculty
    const faculty = await User.create({
      name: 'Dr. John Smith',
      email: 'faculty@example.com',
      password: 'faculty123',
      role: 'FACULTY',
      department: 'Computer Science',
    });
    
    // Create students
    const students = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'student123',
        role: 'STUDENT',
        studentId: 'STU001',
        department: 'Computer Science',
      },
      {
        name: 'Bob Williams',
        email: 'bob@example.com',
        password: 'student123',
        role: 'STUDENT',
        studentId: 'STU002',
        department: 'Computer Science',
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'student123',
        role: 'STUDENT',
        studentId: 'STU003',
        department: 'Computer Science',
      },
    ]);
    
    console.log('Creating classes...');
    
    // Create classes
    await Class.create([
      {
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Introduction to data structures',
        faculty: faculty._id,
        department: 'Computer Science',
        semester: 'Fall 2024',
        students: students.map((s) => s._id),
      },
      {
        name: 'Database Management Systems',
        code: 'CS301',
        description: 'Relational databases and SQL',
        faculty: faculty._id,
        department: 'Computer Science',
        semester: 'Fall 2024',
        students: students.map((s) => s._id),
      },
    ]);
    
    console.log('✅ Database seeded successfully!');
    console.log('\n🔐 Login credentials:');
    console.log('👑 Owner: sumantyadav3086@gmail.com / admin123');
    console.log('👨‍🏫 Faculty: faculty@example.com / faculty123');
    console.log('👨‍🎓 Student: alice@example.com / student123');
    console.log('\n📞 Contact: +91 9599617479');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
