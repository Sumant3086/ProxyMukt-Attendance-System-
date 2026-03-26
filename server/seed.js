import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Class from './src/models/Class.js';
import Session from './src/models/Session.js';
import Attendance from './src/models/Attendance.js';
import Notification from './src/models/Notification.js';
import connectDB from './src/config/db.js';

dotenv.config();

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(6));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Session.deleteMany({}),
      Attendance.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('🌱 Seeding users...');

    // Admin
    const admin = await User.create({
      name: 'Dr. Admin Kumar',
      email: process.env.ADMIN_EMAIL || 'admin@proxymukt.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'ADMIN',
      department: 'Administration',
    });

    // Faculty members (realistic names)
    const facultyNames = [
      { name: 'Dr. Rajesh Sharma', email: 'rajesh.sharma@proxymukt.com' },
      { name: 'Prof. Priya Mehta', email: 'priya.mehta@proxymukt.com' },
      { name: 'Dr. Anil Verma', email: 'anil.verma@proxymukt.com' },
      { name: 'Prof. Sunita Patel', email: 'sunita.patel@proxymukt.com' },
      { name: 'Dr. Vikram Nair', email: 'vikram.nair@proxymukt.com' },
      { name: 'Prof. Meena Iyer', email: 'meena.iyer@proxymukt.com' },
    ];

    const facultyData = facultyNames.map((f, i) => ({
      ...f,
      password: `Faculty@${i + 1}23`,
      role: 'FACULTY',
      department: 'Computer Science',
    }));
    // Add numbered faculty
    for (let i = 7; i <= 50; i++) {
      facultyData.push({
        name: `Faculty Member ${i}`,
        email: `faculty${i}@gmail.com`,
        password: `Faculty123`,
        role: 'FACULTY',
        department: i % 3 === 0 ? 'Electronics' : i % 2 === 0 ? 'Mathematics' : 'Computer Science',
      });
    }

    const faculty = await User.create(facultyData);

    // Students (realistic names + numbered)
    const studentNames = [
      'Aarav Singh', 'Ananya Sharma', 'Arjun Patel', 'Diya Mehta', 'Ishaan Kumar',
      'Kavya Reddy', 'Rohan Gupta', 'Sneha Joshi', 'Vikram Nair', 'Zara Khan',
      'Aditya Rao', 'Bhavna Tiwari', 'Chirag Shah', 'Deepika Iyer', 'Eshan Malhotra',
      'Fatima Siddiqui', 'Gaurav Mishra', 'Harini Pillai', 'Ishan Bose', 'Jyoti Yadav',
    ];

    const studentData = studentNames.map((name, i) => ({
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@student.proxymukt.com`,
      password: `Student@${i + 1}23`,
      role: 'STUDENT',
      studentId: `STU${(i + 1).toString().padStart(3, '0')}`,
      department: 'Computer Science',
    }));

    // Add 480 more numbered students
    for (let i = 21; i <= 500; i++) {
      studentData.push({
        name: `Student ${i}`,
        email: `user${i}@gmail.com`,
        password: `Student123`,
        role: 'STUDENT',
        studentId: `STU${i.toString().padStart(3, '0')}`,
        department: i % 4 === 0 ? 'Electronics' : i % 3 === 0 ? 'Mathematics' : 'Computer Science',
      });
    }

    const students = await User.create(studentData);

    console.log('🏫 Seeding classes...');

    // Enroll first 100 students in each named faculty class
    // Remaining faculty get smaller classes of 30-50 students each
    const classesData = [
      {
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Fundamental data structures, algorithm design and analysis',
        faculty: faculty[0]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [
          { day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Lab 101' },
          { day: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'Lab 101' },
        ],
        students: students.slice(0, 100).map((s) => s._id),
      },
      {
        name: 'Database Management Systems',
        code: 'CS301',
        description: 'Relational databases, SQL, NoSQL and database design',
        faculty: faculty[1]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [
          { day: 'Tuesday', startTime: '11:00', endTime: '12:30', room: 'Room 205' },
          { day: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'Room 205' },
        ],
        students: students.slice(50, 150).map((s) => s._id),
      },
      {
        name: 'Web Development',
        code: 'CS401',
        description: 'Full-stack web development with React and Node.js',
        faculty: faculty[2]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [
          { day: 'Monday', startTime: '14:00', endTime: '15:30', room: 'Lab 202' },
          { day: 'Friday', startTime: '14:00', endTime: '15:30', room: 'Lab 202' },
        ],
        students: students.slice(100, 200).map((s) => s._id),
      },
      {
        name: 'Machine Learning',
        code: 'CS501',
        description: 'Introduction to ML algorithms and applications',
        faculty: faculty[3]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [
          { day: 'Wednesday', startTime: '14:00', endTime: '15:30', room: 'Room 301' },
          { day: 'Friday', startTime: '09:00', endTime: '10:30', room: 'Room 301' },
        ],
        students: students.slice(150, 250).map((s) => s._id),
      },
      {
        name: 'Operating Systems',
        code: 'CS601',
        description: 'Process management, memory, file systems',
        faculty: faculty[4]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [{ day: 'Tuesday', startTime: '09:00', endTime: '10:30', room: 'Room 102' }],
        students: students.slice(200, 280).map((s) => s._id),
      },
      {
        name: 'Computer Networks',
        code: 'CS701',
        description: 'Network protocols, TCP/IP, security',
        faculty: faculty[5]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [{ day: 'Thursday', startTime: '14:00', endTime: '15:30', room: 'Lab 303' }],
        students: students.slice(250, 330).map((s) => s._id),
      },
    ];

    // Add classes for remaining numbered faculty (each gets 30-50 students)
    const subjects = [
      'Software Engineering', 'Computer Architecture', 'Compiler Design',
      'Artificial Intelligence', 'Cloud Computing', 'Cyber Security',
      'Mobile App Development', 'Embedded Systems', 'Digital Electronics',
      'Discrete Mathematics',
    ];
    for (let i = 6; i < Math.min(faculty.length, 16); i++) {
      const subjectIndex = (i - 6) % subjects.length;
      const startStudent = (i - 6) * 30 + 330;
      classesData.push({
        name: subjects[subjectIndex],
        code: `CS${800 + (i - 6) * 10}`,
        description: `${subjects[subjectIndex]} course`,
        faculty: faculty[i]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [{ day: 'Monday', startTime: '10:00', endTime: '11:30', room: `Room ${400 + i}` }],
        students: students.slice(startStudent, Math.min(startStudent + 40, students.length)).map((s) => s._id),
      });
    }

    const classes = await Class.create(classesData);

    console.log('📅 Seeding sessions and attendance...');

    // Session titles per class
    const sessionTitles = {
      CS201: [
        'Introduction to Arrays and Linked Lists',
        'Stacks and Queues',
        'Binary Trees and BST',
        'Graph Algorithms - BFS & DFS',
        'Dynamic Programming Basics',
        'Sorting Algorithms',
        'Hashing and Hash Tables',
        'Heaps and Priority Queues',
        'Greedy Algorithms',
        'Divide and Conquer',
        'Advanced Graph Algorithms',
        'String Algorithms',
      ],
      CS301: [
        'Introduction to DBMS',
        'ER Diagrams and Normalization',
        'SQL Basics - DDL and DML',
        'Advanced SQL - Joins and Subqueries',
        'Transactions and ACID Properties',
        'Indexing and Query Optimization',
        'NoSQL Databases - MongoDB',
        'Database Security',
        'Stored Procedures and Triggers',
        'Distributed Databases',
      ],
      CS401: [
        'HTML5 and CSS3 Fundamentals',
        'JavaScript ES6+ Features',
        'React.js Introduction',
        'React Hooks and State Management',
        'Node.js and Express.js',
        'REST API Design',
        'MongoDB Integration',
        'Authentication with JWT',
        'Deployment and DevOps',
        'Full Stack Project Review',
      ],
      CS501: [
        'Introduction to Machine Learning',
        'Linear Regression',
        'Logistic Regression',
        'Decision Trees and Random Forests',
        'Support Vector Machines',
        'Neural Networks Basics',
        'Deep Learning Introduction',
        'Convolutional Neural Networks',
        'Natural Language Processing',
        'Model Evaluation and Tuning',
      ],
    };

    // Campus location (approximate)
    const campusLat = 28.6139;
    const campusLon = 77.2090;

    const allSessions = [];

    for (const cls of classes) {
      const defaultTitles = Array.from({ length: 8 }, (_, i) => `Lecture ${i + 1} - ${cls.name}`);
      const titles = sessionTitles[cls.code] || defaultTitles;
      const enrolledStudents = cls.students;

      const totalSessions = titles.length;

      for (let i = 0; i < totalSessions; i++) {
        const daysBack = (totalSessions - i) * 3 + randomBetween(0, 2);
        const sessionDate = daysAgo(daysBack);
        const isCompleted = daysBack > 1;
        const isLive = !isCompleted && i === totalSessions - 1;

        const session = await Session.create({
          class: cls._id,
          faculty: cls.faculty,
          title: titles[i],
          date: sessionDate,
          startTime: sessionDate,
          endTime: isCompleted ? new Date(sessionDate.getTime() + 90 * 60000) : undefined,
          status: isLive ? 'LIVE' : isCompleted ? 'COMPLETED' : 'COMPLETED',
          location: {
            room: cls.schedule[0]?.room || 'Room 101',
            building: 'Main Block',
            latitude: campusLat + randomFloat(-0.001, 0.001),
            longitude: campusLon + randomFloat(-0.001, 0.001),
            radius: 100,
            geofencingEnabled: true,
          },
          totalStudents: enrolledStudents.length,
          attendanceCount: 0,
        });

        allSessions.push(session);

        if (!isCompleted && !isLive) continue;

        const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
        const oses = ['Android', 'iOS', 'Windows', 'macOS'];
        const platforms = ['Mobile', 'Mobile', 'Desktop', 'Mobile'];

        const attendanceBatch = [];
        for (let si = 0; si < enrolledStudents.length; si++) {
          const studentId = enrolledStudents[si];
          let attendProb;
          if (si < 5) attendProb = randomBetween(85, 95) / 100;
          else if (si < 15) attendProb = randomBetween(65, 80) / 100;
          else if (si < 20) attendProb = randomBetween(40, 60) / 100;
          else attendProb = randomBetween(55, 90) / 100;

          if (Math.random() < attendProb) {
            const markedAt = new Date(sessionDate.getTime() + randomBetween(0, 10) * 60000);
            attendanceBatch.push({
              session: session._id,
              student: studentId,
              class: cls._id,
              status: 'PRESENT',
              markedAt,
              qrToken: `demo_token_${session._id}_${si}`,
              attendanceSource: 'QR',
              deviceInfo: {
                userAgent: `Mozilla/5.0 (${randomChoice(oses)}) AppleWebKit/537.36`,
                ip: `192.168.${randomBetween(1, 10)}.${randomBetween(1, 254)}`,
                deviceFingerprint: `fp_${Math.random().toString(36).substr(2, 16)}`,
                browser: randomChoice(browsers),
                os: randomChoice(oses),
                platform: randomChoice(platforms),
                isProxy: false,
                isVPN: false,
                isTor: false,
                riskScore: randomBetween(0, 15),
              },
              location: {
                latitude: campusLat + randomFloat(-0.0005, 0.0005),
                longitude: campusLon + randomFloat(-0.0005, 0.0005),
                accuracy: randomBetween(5, 30),
                verified: true,
                distance: randomBetween(5, 80),
                suspicious: false,
              },
            });
          }
        }

        if (attendanceBatch.length > 0) {
          await Attendance.insertMany(attendanceBatch, { ordered: false });
        }
        await Session.findByIdAndUpdate(session._id, { attendanceCount: attendanceBatch.length });
      }
    }

    // Seed notifications for first few students
    const notifData = [];
    for (const student of students.slice(0, 10)) {
      notifData.push({
        user: student._id,
        type: 'SESSION_STARTED',
        title: 'Class Started',
        message: 'Your Data Structures class has started. Mark your attendance now!',
        read: false,
      });
      notifData.push({
        user: student._id,
        type: 'LOW_ATTENDANCE_WARNING',
        title: 'Low Attendance Warning',
        message: 'Your attendance in Machine Learning is below 75%. Please attend classes regularly.',
        read: false,
      });
    }
    await Notification.create(notifData);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════');
    console.log('\n👑 ADMIN:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@proxymukt.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('\n👨‍🏫 FACULTY (Named - password Faculty@X23):');
    facultyNames.forEach((f, i) => {
      console.log(`   ${f.name}: ${f.email} / Faculty@${i + 1}23`);
    });
    console.log('\n👨‍🏫 FACULTY (Numbered - ALL use same password):');
    console.log('   faculty7@gmail.com to faculty50@gmail.com / Faculty123');
    console.log('\n👨‍🎓 STUDENTS (Named - password Student@X23):');
    studentNames.slice(0, 5).forEach((name, i) => {
      const email = `${name.toLowerCase().replace(' ', '.')}@student.proxymukt.com`;
      console.log(`   ${name}: ${email} / Student@${i + 1}23`);
    });
    console.log('\n👨‍🎓 STUDENTS (Numbered - ALL use same password):');
    console.log('   user21@gmail.com to user500@gmail.com / Student123');
    console.log('\n📊 SEEDED DATA SUMMARY:');
    console.log(`   👥 Users: 1 admin + ${facultyData.length} faculty + ${studentData.length} students`);
    console.log(`   🏫 Classes: ${classes.length}`);
    console.log(`   📅 Sessions: ${allSessions.length} (all COMPLETED)`);
    console.log(`   ✅ Attendance records: Check MongoDB Atlas`);
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
