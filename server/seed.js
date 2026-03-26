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

const sessionTitles = {
  CS201: ['Introduction to Arrays','Linked Lists','Stacks and Queues','Binary Trees','Graph BFS & DFS','Dynamic Programming','Sorting Algorithms','Hashing','Heaps','Greedy Algorithms','Divide and Conquer','String Algorithms'],
  CS301: ['Intro to DBMS','ER Diagrams','SQL DDL & DML','Advanced SQL Joins','Transactions & ACID','Indexing','NoSQL MongoDB','Database Security','Stored Procedures','Distributed Databases'],
  CS401: ['HTML5 & CSS3','JavaScript ES6+','React.js Intro','React Hooks','Node.js & Express','REST API Design','MongoDB Integration','JWT Authentication','Deployment','Full Stack Review'],
  CS501: ['Intro to ML','Linear Regression','Logistic Regression','Decision Trees','SVM','Neural Networks','Deep Learning','CNN','NLP Basics','Model Evaluation'],
  CS601: ['OS Introduction','Process Management','CPU Scheduling','Memory Management','Virtual Memory','File Systems','I/O Management','Deadlocks','Security','Case Studies'],
  CS701: ['Network Basics','OSI Model','TCP/IP','Routing Protocols','DNS & DHCP','HTTP & HTTPS','Network Security','Firewalls','Wireless Networks','Cloud Networking'],
};

const seedDatabase = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Session.deleteMany({}),
      Attendance.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('🌱 Seeding users...');

    // Admin
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@proxymukt.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'ADMIN',
      department: 'Administration',
    });

    // 50 faculty: faculty1 to faculty50
    const facultyData = [];
    for (let i = 1; i <= 50; i++) {
      facultyData.push({
        name: `faculty${i}`,
        email: `faculty${i}@gmail.com`,
        password: `faculty${i}`,
        role: 'FACULTY',
        department: 'Computer Science',
      });
    }
    const faculty = await User.create(facultyData);

    // 500 students: student1 to student500
    const studentData = [];
    for (let i = 1; i <= 500; i++) {
      studentData.push({
        name: `student${i}`,
        email: `student${i}@gmail.com`,
        password: `student${i}`,
        role: 'STUDENT',
        studentId: `STU${i.toString().padStart(3, '0')}`,
        department: 'Computer Science',
      });
    }
    const students = await User.create(studentData);

    console.log('🏫 Seeding classes...');

    // 6 main classes — each faculty1-6 gets one class with 80-100 students
    const classesData = [
      {
        name: 'Data Structures and Algorithms', code: 'CS201',
        description: 'Fundamental data structures and algorithm design',
        faculty: faculty[0]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Lab 101' }, { day: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'Lab 101' }],
        students: students.slice(0, 80).map(s => s._id),
      },
      {
        name: 'Database Management Systems', code: 'CS301',
        description: 'Relational databases, SQL and NoSQL',
        faculty: faculty[1]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Tuesday', startTime: '11:00', endTime: '12:30', room: 'Room 205' }, { day: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'Room 205' }],
        students: students.slice(80, 160).map(s => s._id),
      },
      {
        name: 'Web Development', code: 'CS401',
        description: 'Full-stack web development with React and Node.js',
        faculty: faculty[2]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Monday', startTime: '14:00', endTime: '15:30', room: 'Lab 202' }, { day: 'Friday', startTime: '14:00', endTime: '15:30', room: 'Lab 202' }],
        students: students.slice(160, 240).map(s => s._id),
      },
      {
        name: 'Machine Learning', code: 'CS501',
        description: 'Introduction to ML algorithms and applications',
        faculty: faculty[3]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Wednesday', startTime: '14:00', endTime: '15:30', room: 'Room 301' }, { day: 'Friday', startTime: '09:00', endTime: '10:30', room: 'Room 301' }],
        students: students.slice(240, 320).map(s => s._id),
      },
      {
        name: 'Operating Systems', code: 'CS601',
        description: 'Process management, memory and file systems',
        faculty: faculty[4]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Tuesday', startTime: '09:00', endTime: '10:30', room: 'Room 102' }, { day: 'Thursday', startTime: '09:00', endTime: '10:30', room: 'Room 102' }],
        students: students.slice(320, 400).map(s => s._id),
      },
      {
        name: 'Computer Networks', code: 'CS701',
        description: 'Network protocols, TCP/IP and security',
        faculty: faculty[5]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Thursday', startTime: '14:00', endTime: '15:30', room: 'Lab 303' }, { day: 'Friday', startTime: '11:00', endTime: '12:30', room: 'Lab 303' }],
        students: students.slice(400, 500).map(s => s._id),
      },
    ];

    // Remaining faculty (7-50) each get a small class of 30 students
    const extraSubjects = [
      'Software Engineering','Computer Architecture','Compiler Design','Artificial Intelligence',
      'Cloud Computing','Cyber Security','Mobile App Development','Embedded Systems',
      'Digital Electronics','Discrete Mathematics','Theory of Computation','Computer Graphics',
      'Information Security','Big Data Analytics','Internet of Things','Blockchain Technology',
      'Quantum Computing','Robotics','Natural Language Processing','Computer Vision',
      'Distributed Systems','Parallel Computing','Software Testing','DevOps Practices',
      'Microprocessors','VLSI Design','Signal Processing','Control Systems',
      'Numerical Methods','Linear Algebra for CS','Probability & Statistics','Game Development',
      'AR/VR Development','Edge Computing','5G Networks','Ethical Hacking',
      'Digital Forensics','Bioinformatics','Health Informatics','E-Commerce Systems',
      'ERP Systems','Supply Chain Tech','FinTech','Smart Grid Technology',
    ];

    for (let i = 6; i < faculty.length; i++) {
      const subjectIndex = i - 6;
      const startStudent = (subjectIndex % 15) * 30;
      classesData.push({
        name: extraSubjects[subjectIndex] || `Elective ${i}`,
        code: `CS${900 + subjectIndex}`,
        description: `${extraSubjects[subjectIndex] || 'Elective'} course`,
        faculty: faculty[i]._id,
        department: 'Computer Science',
        semester: 'Spring 2025',
        schedule: [{ day: 'Monday', startTime: '10:00', endTime: '11:30', room: `Room ${500 + i}` }],
        students: students.slice(startStudent, startStudent + 30).map(s => s._id),
      });
    }

    const classes = await Class.create(classesData);

    console.log('📅 Seeding sessions and attendance...');

    const campusLat = 28.6139;
    const campusLon = 77.2090;
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Android', 'iOS', 'Windows', 'macOS'];
    const platforms = ['Mobile', 'Mobile', 'Desktop', 'Mobile'];

    const allSessions = [];

    for (const cls of classes) {
      const defaultTitles = Array.from({ length: 8 }, (_, i) => `Lecture ${i + 1} - ${cls.name}`);
      const titles = sessionTitles[cls.code] || defaultTitles;
      const enrolledStudents = cls.students;

      for (let i = 0; i < titles.length; i++) {
        const daysBack = (titles.length - i) * 3 + randomBetween(0, 2);
        const sessionDate = daysAgo(daysBack);

        const session = await Session.create({
          class: cls._id,
          faculty: cls.faculty,
          title: titles[i],
          date: sessionDate,
          startTime: sessionDate,
          endTime: new Date(sessionDate.getTime() + 90 * 60000),
          status: 'COMPLETED',
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

        const attendanceBatch = [];
        for (let si = 0; si < enrolledStudents.length; si++) {
          // Varied attendance probabilities for realistic data
          let prob;
          if (si < 5) prob = randomBetween(88, 96) / 100;       // top students
          else if (si < 20) prob = randomBetween(75, 88) / 100;  // good students
          else if (si < 35) prob = randomBetween(55, 74) / 100;  // average
          else if (si < 45) prob = randomBetween(35, 54) / 100;  // at-risk
          else prob = randomBetween(60, 85) / 100;               // rest

          if (Math.random() < prob) {
            attendanceBatch.push({
              session: session._id,
              student: enrolledStudents[si],
              class: cls._id,
              status: 'PRESENT',
              markedAt: new Date(sessionDate.getTime() + randomBetween(0, 10) * 60000),
              qrToken: `seed_${session._id}_${si}`,
              attendanceSource: 'QR',
              deviceInfo: {
                userAgent: `Mozilla/5.0 (${randomChoice(oses)}) AppleWebKit/537.36`,
                ip: `192.168.${randomBetween(1, 10)}.${randomBetween(1, 254)}`,
                deviceFingerprint: `fp_${Math.random().toString(36).substring(2, 18)}`,
                browser: randomChoice(browsers),
                os: randomChoice(oses),
                platform: randomChoice(platforms),
                isProxy: false, isVPN: false, isTor: false,
                riskScore: randomBetween(0, 10),
              },
              location: {
                latitude: campusLat + randomFloat(-0.0005, 0.0005),
                longitude: campusLon + randomFloat(-0.0005, 0.0005),
                accuracy: randomBetween(5, 25),
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

    // Notifications for first 10 students
    const notifData = [];
    for (const student of students.slice(0, 10)) {
      notifData.push({ user: student._id, type: 'SESSION_STARTED', title: 'Class Started', message: 'Your class has started. Mark your attendance now!', read: false });
      notifData.push({ user: student._id, type: 'LOW_ATTENDANCE_WARNING', title: 'Low Attendance Warning', message: 'Your attendance is below 75%. Please attend classes regularly.', read: false });
    }
    await Notification.create(notifData);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`\n👑 ADMIN:    ${process.env.ADMIN_EMAIL || 'admin@proxymukt.com'}  /  ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('\n👨‍🏫 FACULTY:  faculty1@gmail.com  /  faculty1   (faculty1 to faculty50)');
    console.log('\n👨‍🎓 STUDENT:  student1@gmail.com  /  student1   (student1 to student500)');
    console.log('\n📊 SUMMARY:');
    console.log(`   Users    : 1 admin + 50 faculty + 500 students`);
    console.log(`   Classes  : ${classes.length}`);
    console.log(`   Sessions : ${allSessions.length} (all COMPLETED)`);
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
