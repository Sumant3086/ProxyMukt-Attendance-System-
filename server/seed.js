import dotenv from 'dotenv';
import User from './src/models/User.js';
import Class from './src/models/Class.js';
import Session from './src/models/Session.js';
import Attendance from './src/models/Attendance.js';
import Notification from './src/models/Notification.js';
import Alert from './src/models/Alert.js';
import StudentAppeal from './src/models/StudentAppeal.js';
import AuditLog from './src/models/AuditLog.js';
import OnlineSession from './src/models/OnlineSession.js';
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

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('\n✅ Database already seeded with data!');
      console.log(`   Found ${userCount} users in database`);
      console.log('\n📊 EXISTING DATA:');
      
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      const facultyCount = await User.countDocuments({ role: 'FACULTY' });
      const studentCount = await User.countDocuments({ role: 'STUDENT' });
      const classCount = await Class.countDocuments();
      const sessionCount = await Session.countDocuments();
      const attendanceCount = await Attendance.countDocuments();
      const alertCount = await Alert.countDocuments();
      
      console.log(`   Admins      : ${adminCount}`);
      console.log(`   Faculty     : ${facultyCount}`);
      console.log(`   Students    : ${studentCount}`);
      console.log(`   Classes     : ${classCount}`);
      console.log(`   Sessions    : ${sessionCount}`);
      console.log(`   Attendance  : ${attendanceCount}`);
      console.log(`   Alerts      : ${alertCount}`);
      console.log('\n💡 To reseed the database, delete all collections and run: npm run seed\n');
      
      process.exit(0);
    }

    console.log('🌱 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Session.deleteMany({}),
      Attendance.deleteMany({}),
      Notification.deleteMany({}),
      Alert.deleteMany({}),
      StudentAppeal.deleteMany({}),
      AuditLog.deleteMany({}),
      OnlineSession.deleteMany({}),
    ]);

    console.log('🌱 Seeding users...');

    // Admin
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'sumant@gmail.com',
      password: process.env.ADMIN_PASSWORD || '@Sumant3086',
      role: 'ADMIN',
      department: 'Administration',
    });

    // 5 faculty: faculty1 to faculty5
    const facultyData = [];
    for (let i = 1; i <= 5; i++) {
      facultyData.push({
        name: `faculty${i}`,
        email: `faculty${i}@gmail.com`,
        password: `faculty${i}`,
        role: 'FACULTY',
        department: 'Computer Science',
      });
    }
    const faculty = await User.create(facultyData);

    // 200 students: student1 to student200
    const studentData = [];
    for (let i = 1; i <= 200; i++) {
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

    // ALL STUDENTS enrolled in EVERY faculty member's class
    const allStudentIds = students.map(s => s._id);

    // 5 main classes — each faculty gets ALL 200 students
    const classesData = [
      {
        name: 'Data Structures and Algorithms', code: 'CS201',
        description: 'Fundamental data structures and algorithm design',
        faculty: faculty[0]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Lab 101' }, { day: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'Lab 101' }],
        students: allStudentIds,
      },
      {
        name: 'Database Management Systems', code: 'CS301',
        description: 'Relational databases, SQL and NoSQL',
        faculty: faculty[1]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Tuesday', startTime: '11:00', endTime: '12:30', room: 'Room 205' }, { day: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'Room 205' }],
        students: allStudentIds,
      },
      {
        name: 'Web Development', code: 'CS401',
        description: 'Full-stack web development with React and Node.js',
        faculty: faculty[2]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Monday', startTime: '14:00', endTime: '15:30', room: 'Lab 202' }, { day: 'Friday', startTime: '14:00', endTime: '15:30', room: 'Lab 202' }],
        students: allStudentIds,
      },
      {
        name: 'Machine Learning', code: 'CS501',
        description: 'Introduction to ML algorithms and applications',
        faculty: faculty[3]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Wednesday', startTime: '14:00', endTime: '15:30', room: 'Room 301' }, { day: 'Friday', startTime: '09:00', endTime: '10:30', room: 'Room 301' }],
        students: allStudentIds,
      },
      {
        name: 'Operating Systems', code: 'CS601',
        description: 'Process management, memory and file systems',
        faculty: faculty[4]._id, department: 'Computer Science', semester: 'Spring 2025',
        schedule: [{ day: 'Tuesday', startTime: '09:00', endTime: '10:30', room: 'Room 102' }, { day: 'Thursday', startTime: '09:00', endTime: '10:30', room: 'Room 102' }],
        students: allStudentIds,
      },
    ];

    // Remaining faculty (none - we only have 5 total)
    // No extra classes needed

    const classes = await Class.create(classesData);

    console.log('📅 Seeding sessions and attendance (this may take 2-3 minutes)...');

    const campusLat = 28.6139;
    const campusLon = 77.2090;
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Android', 'iOS', 'Windows', 'macOS'];
    const platforms = ['Mobile', 'Mobile', 'Desktop', 'Mobile'];

    const allSessions = [];
    const allAttendances = [];

    for (const cls of classes) {
      const defaultTitles = Array.from({ length: 8 }, (_, i) => `Lecture ${i + 1} - ${cls.name}`);
      const titles = sessionTitles[cls.code] || defaultTitles;
      const enrolledStudents = cls.students;

      for (let i = 0; i < titles.length; i++) {
        const daysBack = (titles.length - i) * 3 + randomBetween(0, 2);
        const sessionDate = daysAgo(daysBack);

        const session = {
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
        };

        allSessions.push(session);
      }
    }

    // Bulk insert sessions
    console.log(`   Creating ${allSessions.length} sessions...`);
    const createdSessions = await Session.insertMany(allSessions);
    console.log(`   ✓ Sessions created`);

    // Generate attendance for all sessions
    console.log(`   Generating attendance records...`);
    let attendanceCounter = 0;
    
    for (const session of createdSessions) {
      const cls = classes.find(c => c._id.toString() === session.class.toString());
      const enrolledStudents = cls.students;
      
      for (let si = 0; si < enrolledStudents.length; si++) {
        // Varied attendance probabilities for realistic data
        let prob;
        if (si < 5) prob = randomBetween(88, 96) / 100;
        else if (si < 20) prob = randomBetween(75, 88) / 100;
        else if (si < 35) prob = randomBetween(55, 74) / 100;
        else if (si < 45) prob = randomBetween(35, 54) / 100;
        else prob = randomBetween(60, 85) / 100;

        if (Math.random() < prob) {
          // Generate realistic risk scores with varied patterns
          let riskScore = randomBetween(0, 15);
          let isProxy = false;
          let isVPN = false;
          let isTor = false;
          let suspicious = false;
          
          if (Math.random() < 0.05) {
            riskScore = randomBetween(50, 75);
            isProxy = Math.random() < 0.3;
            isVPN = Math.random() < 0.4;
            suspicious = Math.random() < 0.5;
          }
          
          if (Math.random() < 0.01) {
            riskScore = randomBetween(76, 95);
            isProxy = Math.random() < 0.6;
            isVPN = Math.random() < 0.7;
            isTor = Math.random() < 0.2;
            suspicious = true;
          }
          
          allAttendances.push({
            session: session._id,
            student: enrolledStudents[si],
            class: cls._id,
            status: 'PRESENT',
            markedAt: new Date(session.date.getTime() + randomBetween(0, 10) * 60000),
            qrToken: `seed_${session._id}_${si}`,
            attendanceSource: 'QR',
            deviceInfo: {
              userAgent: `Mozilla/5.0 (${randomChoice(oses)}) AppleWebKit/537.36`,
              ip: `192.168.${randomBetween(1, 10)}.${randomBetween(1, 254)}`,
              deviceFingerprint: `fp_${Math.random().toString(36).substring(2, 18)}`,
              browser: randomChoice(browsers),
              os: randomChoice(oses),
              platform: randomChoice(platforms),
              isProxy,
              isVPN,
              isTor,
              riskScore,
            },
            location: {
              latitude: campusLat + randomFloat(-0.0005, 0.0005),
              longitude: campusLon + randomFloat(-0.0005, 0.0005),
              accuracy: randomBetween(5, 25),
              verified: !suspicious,
              distance: randomBetween(5, 80),
              suspicious,
            },
          });
          
          attendanceCounter++;
        }
      }
      
      // Update session attendance count
      session.attendanceCount = allAttendances.filter(a => a.session.toString() === session._id.toString()).length;
    }

    // Bulk insert attendance in chunks
    console.log(`   Inserting ${allAttendances.length} attendance records in batches...`);
    const chunkSize = 5000;
    for (let i = 0; i < allAttendances.length; i += chunkSize) {
      const chunk = allAttendances.slice(i, i + chunkSize);
      await Attendance.insertMany(chunk, { ordered: false });
      console.log(`   ✓ Inserted ${Math.min(i + chunkSize, allAttendances.length)}/${allAttendances.length} records`);
    }

    // Update session attendance counts
    console.log(`   Updating session attendance counts...`);
    for (const session of createdSessions) {
      await Session.findByIdAndUpdate(session._id, { attendanceCount: session.attendanceCount });
    }

    console.log('🚨 Seeding alerts and appeals...');
    
    // Create alerts for high-risk attendances
    const alertsData = [];
    const appealsData = [];
    const highRiskAttendances = await Attendance.find({ 'deviceInfo.riskScore': { $gte: 50 } }).limit(100);
    
    for (const att of highRiskAttendances) {
      const riskScore = att.deviceInfo.riskScore;
      const riskFactors = [];
      
      if (att.deviceInfo.isProxy) riskFactors.push('PROXY_DETECTED');
      if (att.deviceInfo.isVPN) riskFactors.push('VPN_DETECTED');
      if (att.location?.suspicious) riskFactors.push('LOCATION_SPOOFING');
      if (riskScore >= 70) riskFactors.push('SUSPICIOUS_DEVICE');
      
      const severity = riskScore >= 85 ? 'CRITICAL' : riskScore >= 70 ? 'HIGH' : 'MEDIUM';
      const status = Math.random() > 0.7 ? 'REVIEWED' : 'PENDING';
      
      const alert = {
        student: att.student,
        attendance: att._id,
        session: att.session,
        class: att.class,
        riskScore,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['SUSPICIOUS_DEVICE'],
        severity,
        status,
        deviceInfo: {
          ip: att.deviceInfo.ip,
          userAgent: att.deviceInfo.userAgent,
          browser: att.deviceInfo.browser,
          os: att.deviceInfo.os,
          deviceFingerprint: att.deviceInfo.deviceFingerprint,
        },
        locationInfo: att.location ? {
          latitude: att.location.latitude,
          longitude: att.location.longitude,
          accuracy: att.location.accuracy,
        } : undefined,
      };
      
      if (status === 'REVIEWED') {
        alert.reviewedBy = faculty[randomBetween(0, 4)]._id;
        alert.reviewedAt = new Date(att.createdAt.getTime() + randomBetween(1, 24) * 3600000);
        alert.reviewNotes = randomChoice([
          'Verified legitimate attendance',
          'False positive - student was on campus',
          'Network issue caused high risk score',
        ]);
      }
      
      alertsData.push(alert);
      
      // Create appeals for some alerts
      if (Math.random() > 0.6 && alertsData.length <= 30) {
        appealsData.push({
          student: att.student,
          alert: null, // Will be set after alert creation
          attendance: att._id,
          reason: randomChoice([
            'I was present in class. My phone had network issues that day.',
            'I was using campus WiFi which might have triggered the VPN detection.',
            'My location services were not working properly on that day.',
            'I borrowed my friend\'s phone to mark attendance as mine was dead.',
          ]),
          status: randomChoice(['PENDING', 'PENDING', 'APPROVED', 'REJECTED']),
          evidence: 'Student provided photo evidence of being in class',
        });
      }
    }
    
    const createdAlerts = await Alert.create(alertsData);
    
    // Link appeals to alerts
    for (let i = 0; i < appealsData.length && i < createdAlerts.length; i++) {
      appealsData[i].alert = createdAlerts[i]._id;
      if (appealsData[i].status !== 'PENDING') {
        appealsData[i].reviewedBy = faculty[randomBetween(0, 4)]._id;
        appealsData[i].reviewedAt = new Date();
        appealsData[i].reviewNotes = appealsData[i].status === 'APPROVED' 
          ? 'Appeal approved after verification' 
          : 'Insufficient evidence provided';
      }
    }
    
    if (appealsData.length > 0) {
      await StudentAppeal.create(appealsData);
    }

    console.log('📢 Seeding notifications...');
    
    // Notifications for students
    const notifData = [];
    const atRiskStudents = students.slice(35, 50); // Students with low attendance
    
    for (const student of students.slice(0, 50)) {
      notifData.push({ 
        user: student._id, 
        type: 'SESSION_STARTED', 
        title: 'Class Started', 
        message: 'Data Structures class has started. Mark your attendance now!', 
        read: Math.random() > 0.5,
        createdAt: daysAgo(randomBetween(0, 3)),
      });
    }
    
    for (const student of atRiskStudents) {
      notifData.push({ 
        user: student._id, 
        type: 'LOW_ATTENDANCE_WARNING', 
        title: 'Low Attendance Warning', 
        message: 'Your attendance is below 75%. Please attend classes regularly to avoid academic penalties.', 
        read: Math.random() > 0.3,
        createdAt: daysAgo(randomBetween(1, 5)),
      });
    }
    
    // Notifications for faculty
    for (const fac of faculty.slice(0, 10)) {
      notifData.push({
        user: fac._id,
        type: 'CLASS_CREATED',
        title: 'Class Created Successfully',
        message: 'Your class has been created and students have been enrolled.',
        read: true,
        createdAt: daysAgo(randomBetween(20, 30)),
      });
    }
    
    await Notification.create(notifData);

    console.log('📝 Seeding audit logs...');
    
    // Audit logs for various actions
    const auditData = [];
    const admin = await User.findOne({ role: 'ADMIN' });
    
    // Login logs
    for (const user of [...faculty.slice(0, 10), ...students.slice(0, 30)]) {
      for (let i = 0; i < randomBetween(3, 8); i++) {
        auditData.push({
          user: user._id,
          action: 'LOGIN',
          ipAddress: `192.168.${randomBetween(1, 10)}.${randomBetween(1, 254)}`,
          userAgent: `Mozilla/5.0 (${randomChoice(oses)}) AppleWebKit/537.36`,
          deviceFingerprint: `fp_${Math.random().toString(36).substring(2, 18)}`,
          status: 'SUCCESS',
          createdAt: daysAgo(randomBetween(0, 30)),
        });
      }
    }
    
    // Session creation logs - use date field which exists
    for (let i = 0; i < Math.min(50, createdSessions.length); i++) {
      const session = createdSessions[i];
      if (session && session.date) {
        auditData.push({
          user: session.faculty,
          action: 'SESSION_CREATE',
          resource: 'Session',
          resourceId: session._id,
          details: { title: session.title, classId: session.class },
          ipAddress: `192.168.1.${randomBetween(1, 254)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'SUCCESS',
          createdAt: new Date(session.date.getTime() - 3600000),
        });
      }
    }
    
    // Admin actions
    for (let i = 0; i < 20; i++) {
      auditData.push({
        user: admin._id,
        action: randomChoice(['USER_CREATE', 'CLASS_CREATE', 'SETTINGS_UPDATE', 'REPORT_EXPORT']),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'SUCCESS',
        createdAt: daysAgo(randomBetween(0, 30)),
      });
    }
    
    await AuditLog.create(auditData);

    console.log('💻 Seeding online sessions...');
    
    // Create some online sessions using createdSessions which have _id
    const onlineSessionsData = [];
    const recentSessions = createdSessions.slice(0, 10);
    
    for (const session of recentSessions) {
      const participants = [];
      const cls = classes.find(c => c._id.toString() === session.class.toString());
      if (!cls || !cls.students) continue;
      
      const attendingStudents = cls.students.slice(0, randomBetween(30, 60));
      
      for (const studentId of attendingStudents) {
        const joinTime = new Date(session.startTime.getTime() + randomBetween(0, 10) * 60000);
        const duration = randomBetween(40, 90);
        const leaveTime = new Date(joinTime.getTime() + duration * 60000);
        
        participants.push({
          student: studentId,
          joinTime,
          leaveTime,
          duration,
          cameraStatus: randomChoice(['ON', 'ON', 'OFF', 'PARTIAL']),
          micStatus: randomChoice(['ON', 'OFF', 'PARTIAL']),
          engagementScore: randomBetween(60, 95),
          tabSwitches: randomBetween(0, 15),
          chatMessages: randomBetween(0, 10),
          attentionTime: Math.floor(duration * randomFloat(0.7, 0.95)),
        });
      }
      
      onlineSessionsData.push({
        session: session._id,
        platform: randomChoice(['ZOOM', 'GOOGLE_MEET', 'TEAMS']),
        meetingId: `MTG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        meetingLink: `https://zoom.us/j/${randomBetween(100000000, 999999999)}`,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: 90,
        participants,
        status: 'ENDED',
      });
    }
    
    if (onlineSessionsData.length > 0) {
      await OnlineSession.create(onlineSessionsData);
    }

    // Calculate final statistics
    const totalAttendance = await Attendance.countDocuments();
    const totalAlerts = await Alert.countDocuments();
    const totalAppeals = await StudentAppeal.countDocuments();
    const totalAuditLogs = await AuditLog.countDocuments();
    const totalNotifications = await Notification.countDocuments();
    const totalOnlineSessions = await OnlineSession.countDocuments();

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`\n👑 ADMIN:    ${process.env.ADMIN_EMAIL || 'sumant@gmail.com'}  /  ${process.env.ADMIN_PASSWORD || '@Sumant3086'}`);
    console.log('\n👨‍🏫 FACULTY:  faculty1@gmail.com  /  faculty1   (faculty1 to faculty5)');
    console.log('\n👨‍🎓 STUDENT:  student1@gmail.com  /  student1   (student1 to student200)');
    console.log('\n📊 COMPREHENSIVE DATA SUMMARY:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   Users           : 206 (1 admin + 5 faculty + 200 students)`);
    console.log(`   Classes         : ${classes.length}`);
    console.log(`   Sessions        : ${allSessions.length} (all COMPLETED)`);
    console.log(`   Attendance      : ${totalAttendance} records`);
    console.log(`   Alerts          : ${totalAlerts} (fraud detection)`);
    console.log(`   Appeals         : ${totalAppeals} (student appeals)`);
    console.log(`   Notifications   : ${totalNotifications}`);
    console.log(`   Audit Logs      : ${totalAuditLogs}`);
    console.log(`   Online Sessions : ${totalOnlineSessions}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✨ ANALYTICS READY:');
    console.log('   ✓ Student performance trends');
    console.log('   ✓ Faculty class analytics');
    console.log('   ✓ Admin system-wide insights');
    console.log('   ✓ Fraud detection patterns');
    console.log('   ✓ Attendance heatmaps');
    console.log('   ✓ Risk score distributions');
    console.log('   ✓ Engagement metrics');
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
