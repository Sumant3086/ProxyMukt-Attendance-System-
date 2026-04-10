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

const fastSeed = async () => {
  try {
    await connectDB();
    
    console.log('🚀 FAST SEED - Optimized for quick setup\n');
    console.log('🗑️  Clearing existing data...');
    
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

    console.log('👥 Creating users...');
    
    // Admin
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@proxymukt.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'ADMIN',
      department: 'Administration',
    });

    // 10 faculty
    const facultyData = [];
    for (let i = 1; i <= 10; i++) {
      facultyData.push({
        name: `Faculty ${i}`,
        email: `faculty${i}@gmail.com`,
        password: `faculty${i}`,
        role: 'FACULTY',
        department: 'Computer Science',
      });
    }
    const faculty = await User.insertMany(facultyData);

    // 100 students
    const studentData = [];
    for (let i = 1; i <= 100; i++) {
      studentData.push({
        name: `Student ${i}`,
        email: `student${i}@gmail.com`,
        password: `student${i}`,
        role: 'STUDENT',
        studentId: `STU${i.toString().padStart(3, '0')}`,
        department: 'Computer Science',
      });
    }
    const students = await User.insertMany(studentData);
    const allStudentIds = students.map(s => s._id);

    console.log('🏫 Creating classes...');
    
    // 6 classes
    const classesData = [
      { name: 'Data Structures', code: 'CS201', faculty: faculty[0]._id },
      { name: 'Database Systems', code: 'CS301', faculty: faculty[1]._id },
      { name: 'Web Development', code: 'CS401', faculty: faculty[2]._id },
      { name: 'Machine Learning', code: 'CS501', faculty: faculty[3]._id },
      { name: 'Operating Systems', code: 'CS601', faculty: faculty[4]._id },
      { name: 'Computer Networks', code: 'CS701', faculty: faculty[5]._id },
    ].map(c => ({
      ...c,
      description: `${c.name} course`,
      department: 'Computer Science',
      semester: 'Spring 2025',
      schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Lab 101' }],
      students: allStudentIds,
    }));

    const classes = await Class.insertMany(classesData);

    console.log('📅 Creating sessions and attendance...');
    
    const campusLat = 28.6139;
    const campusLon = 77.2090;
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Android', 'iOS', 'Windows', 'macOS'];

    const allSessions = [];
    const allAttendances = [];

    // 5 sessions per class = 30 total sessions
    for (const cls of classes) {
      for (let i = 0; i < 5; i++) {
        const sessionDate = daysAgo(15 - i * 3);
        
        allSessions.push({
          class: cls._id,
          faculty: cls.faculty,
          title: `Lecture ${i + 1} - ${cls.name}`,
          date: sessionDate,
          startTime: sessionDate,
          endTime: new Date(sessionDate.getTime() + 90 * 60000),
          status: 'COMPLETED',
          location: {
            room: 'Lab 101',
            building: 'Main Block',
            latitude: campusLat,
            longitude: campusLon,
            radius: 100,
            geofencingEnabled: true,
          },
          totalStudents: allStudentIds.length,
          attendanceCount: 0,
        });
      }
    }

    const createdSessions = await Session.insertMany(allSessions);
    console.log(`   ✓ Created ${createdSessions.length} sessions`);

    // Generate attendance (70-85% attendance rate)
    console.log('   Generating attendance...');
    for (const session of createdSessions) {
      const cls = classes.find(c => c._id.toString() === session.class.toString());
      
      for (const studentId of cls.students) {
        if (Math.random() < 0.78) { // 78% attendance rate
          const riskScore = Math.random() < 0.95 ? randomBetween(0, 20) : randomBetween(50, 85);
          
          allAttendances.push({
            session: session._id,
            student: studentId,
            class: cls._id,
            status: 'PRESENT',
            markedAt: new Date(session.date.getTime() + randomBetween(0, 10) * 60000),
            qrToken: `seed_${session._id}_${studentId}`,
            attendanceSource: 'QR',
            deviceInfo: {
              userAgent: `Mozilla/5.0 (${randomChoice(oses)})`,
              ip: `192.168.${randomBetween(1, 10)}.${randomBetween(1, 254)}`,
              deviceFingerprint: `fp_${Math.random().toString(36).substring(2, 18)}`,
              browser: randomChoice(browsers),
              os: randomChoice(oses),
              platform: randomChoice(['Mobile', 'Desktop']),
              isProxy: riskScore > 50 && Math.random() < 0.3,
              isVPN: riskScore > 50 && Math.random() < 0.4,
              isTor: false,
              riskScore,
            },
            location: {
              latitude: campusLat + randomFloat(-0.0005, 0.0005),
              longitude: campusLon + randomFloat(-0.0005, 0.0005),
              accuracy: randomBetween(5, 25),
              verified: riskScore < 50,
              distance: randomBetween(5, 80),
              suspicious: riskScore > 50,
            },
          });
        }
      }
    }

    await Attendance.insertMany(allAttendances);
    console.log(`   ✓ Created ${allAttendances.length} attendance records`);

    // Update session counts
    for (const session of createdSessions) {
      const count = allAttendances.filter(a => a.session.toString() === session._id.toString()).length;
      await Session.findByIdAndUpdate(session._id, { attendanceCount: count });
    }

    console.log('🚨 Creating alerts...');
    
    // Get actual attendance records with IDs
    const highRiskAttendances = await Attendance.find({ 'deviceInfo.riskScore': { $gte: 50 } }).limit(20);
    
    const alertsData = highRiskAttendances.map(att => ({
      student: att.student,
      attendance: att._id,
      session: att.session,
      class: att.class,
      riskScore: att.deviceInfo.riskScore,
      riskFactors: att.deviceInfo.isProxy ? ['PROXY_DETECTED'] : ['SUSPICIOUS_DEVICE'],
      severity: att.deviceInfo.riskScore >= 70 ? 'HIGH' : 'MEDIUM',
      status: 'PENDING',
      deviceInfo: {
        ip: att.deviceInfo.ip,
        browser: att.deviceInfo.browser,
        os: att.deviceInfo.os,
      },
    }));

    if (alertsData.length > 0) {
      await Alert.insertMany(alertsData);
    }

    console.log('📢 Creating notifications...');
    
    const notifData = students.slice(0, 20).map(s => ({
      user: s._id,
      type: 'SESSION_STARTED',
      title: 'Class Started',
      message: 'Your class has started. Mark attendance now!',
      read: Math.random() > 0.5,
    }));

    await Notification.insertMany(notifData);

    console.log('📝 Creating audit logs...');
    
    const auditData = [];
    for (const user of [...faculty.slice(0, 5), ...students.slice(0, 10)]) {
      auditData.push({
        user: user._id,
        action: 'LOGIN',
        ipAddress: `192.168.1.${randomBetween(1, 254)}`,
        userAgent: 'Mozilla/5.0',
        status: 'SUCCESS',
        createdAt: daysAgo(randomBetween(0, 15)),
      });
    }

    await AuditLog.insertMany(auditData);

    const stats = {
      users: await User.countDocuments(),
      classes: await Class.countDocuments(),
      sessions: await Session.countDocuments(),
      attendance: await Attendance.countDocuments(),
      alerts: await Alert.countDocuments(),
      notifications: await Notification.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
    };

    console.log('\n✅ FAST SEED COMPLETED!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`\n👑 ADMIN:    ${process.env.ADMIN_EMAIL || 'admin@proxymukt.com'}  /  ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('\n👨‍🏫 FACULTY:  faculty1@gmail.com  /  faculty1   (faculty1-10)');
    console.log('\n👨‍🎓 STUDENT:  student1@gmail.com  /  student1   (student1-100)');
    console.log('\n📊 DATA SUMMARY:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   Users        : ${stats.users} (1 admin + 10 faculty + 100 students)`);
    console.log(`   Classes      : ${stats.classes}`);
    console.log(`   Sessions     : ${stats.sessions}`);
    console.log(`   Attendance   : ${stats.attendance}`);
    console.log(`   Alerts       : ${stats.alerts}`);
    console.log(`   Notifications: ${stats.notifications}`);
    console.log(`   Audit Logs   : ${stats.auditLogs}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✨ Ready for analytics and testing!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

fastSeed();
