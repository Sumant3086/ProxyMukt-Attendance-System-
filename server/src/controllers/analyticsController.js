import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import {
  ATTENDANCE_THRESHOLD_GOOD,
  ATTENDANCE_THRESHOLD_WARNING,
  DAILY_TREND_DAYS,
  AT_RISK_DISPLAY_LIMIT,
  RECENT_SESSIONS_LIMIT,
  MONTHLY_TREND_MONTHS,
} from '../config/constants.js';

/**
 * Get analytics data by section (lazy loading)
 * Sections: overview, trends, students, sessions
 */
export const getAnalyticsBySection = async (req, res) => {
  try {
    const { section = 'overview', classId, startDate, endDate } = req.query;
    const isAdmin = req.user.role === 'ADMIN';

    // Faculty: find only their classes first
    let allowedClassIds = null;
    if (!isAdmin) {
      const facultyClasses = await Class.find({ faculty: req.user._id }, '_id').lean();
      allowedClassIds = facultyClasses.map((c) => c._id);

      if (allowedClassIds.length === 0) {
        return res.json({
          success: true,
          data: {},
        });
      }
    }

    let sessionQuery = {};
    if (classId) {
      sessionQuery.class = classId;
    } else if (allowedClassIds) {
      sessionQuery.class = { $in: allowedClassIds };
    }
    if (startDate || endDate) {
      sessionQuery.date = {};
      if (startDate) sessionQuery.date.$gte = new Date(startDate);
      if (endDate) sessionQuery.date.$lte = new Date(endDate);
    }

    const sessions = await Session.find(sessionQuery).populate('class', 'name code').sort('-date').lean();
    const sessionIds = sessions.map((s) => s._id);
    const attendanceRecords = await Attendance.find({ session: { $in: sessionIds } })
      .populate('student', 'name email studentId')
      .lean();

    let result = {};

    // Overview section
    if (section === 'overview' || section === 'all') {
      const totalStudents = isAdmin ? await User.countDocuments({ role: 'STUDENT' }) : 0;
      const totalFaculty = isAdmin ? await User.countDocuments({ role: 'FACULTY' }) : 0;

      const sessionBreakdown = sessions.map((session) => {
        const count = attendanceRecords.filter(
          (a) => a.session.toString() === session._id.toString()
        ).length;
        const total = session.totalStudents || 1;
        return {
          id: session._id,
          title: session.title,
          class: session.class?.name || 'N/A',
          date: session.date,
          attendance: count,
          total,
          percentage: Math.round((count / total) * 100),
        };
      });

      const avgAttendance =
        sessionBreakdown.length > 0
          ? Math.round(sessionBreakdown.reduce((s, x) => s + x.percentage, 0) / sessionBreakdown.length)
          : 0;

      result.overview = {
        totalStudents: isAdmin ? totalStudents : (allowedClassIds ? sessions.reduce((acc, s) => acc + (s.totalStudents || 0), 0) : 0),
        totalFaculty,
        totalSessions: sessions.length,
        liveSessions: sessions.filter((s) => s.status === 'LIVE').length,
        averageAttendance: avgAttendance,
      };
    }

    // Trends section
    if (section === 'trends' || section === 'all') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DAILY_TREND_DAYS);
      const dailyMap = {};
      sessions
        .filter((s) => new Date(s.date) >= thirtyDaysAgo)
        .forEach((session) => {
          const day = new Date(session.date).toISOString().split('T')[0];
          if (!dailyMap[day]) dailyMap[day] = { total: 0, attendance: 0 };
          dailyMap[day].total += session.totalStudents || 0;
          dailyMap[day].attendance += attendanceRecords.filter(
            (a) => a.session.toString() === session._id.toString()
          ).length;
        });
      const dailyTrend = Object.entries(dailyMap)
        .map(([date, d]) => ({
          date,
          total: d.total,
          attendance: d.attendance,
          percentage: d.total > 0 ? Math.round((d.attendance / d.total) * 100) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      result.trends = dailyTrend;
    }

    // Students section
    if (section === 'students' || section === 'all') {
      const studentMap = {};
      attendanceRecords.forEach((a) => {
        const sid = a.student?._id?.toString();
        if (!sid) return;
        if (!studentMap[sid]) studentMap[sid] = { ...a.student, present: 0 };
        studentMap[sid].present++;
      });

      const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
      const atRiskStudents = Object.values(studentMap)
        .map((s) => ({
          ...s,
          total: completedSessions,
          attendanceRate: completedSessions > 0 ? Math.round((s.present / completedSessions) * 100) : 0,
        }))
        .filter((s) => s.attendanceRate < ATTENDANCE_THRESHOLD_GOOD)
        .sort((a, b) => a.attendanceRate - b.attendanceRate)
        .slice(0, AT_RISK_DISPLAY_LIMIT);

      result.students = atRiskStudents;
    }

    // Sessions section
    if (section === 'sessions' || section === 'all') {
      const sessionBreakdown = sessions.map((session) => {
        const count = attendanceRecords.filter(
          (a) => a.session.toString() === session._id.toString()
        ).length;
        const total = session.totalStudents || 1;
        return {
          id: session._id,
          title: session.title,
          class: session.class?.name || 'N/A',
          date: session.date,
          attendance: count,
          total,
          percentage: Math.round((count / total) * 100),
        };
      });

      result.sessions = sessionBreakdown;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Real Analytics - scoped by role
 * ADMIN sees everything, FACULTY sees only their own classes/sessions
 */
export const getAttendanceAnalytics = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const isAdmin = req.user.role === 'ADMIN';

    // Faculty: find only their classes first
    let allowedClassIds = null;
    if (!isAdmin) {
      const facultyClasses = await Class.find({ faculty: req.user._id }, '_id').lean();
      allowedClassIds = facultyClasses.map((c) => c._id);

      // Faculty has no classes — return empty data
      if (allowedClassIds.length === 0) {
        return res.json({
          success: true,
          data: {
            overview: { totalStudents: 0, totalFaculty: 0, totalSessions: 0, liveSessions: 0, averageAttendance: 0 },
            atRiskStudents: [],
            dailyTrend: [],
            sessionBreakdown: [],
          },
        });
      }
    }

    let sessionQuery = {};
    if (classId) {
      sessionQuery.class = classId;
    } else if (allowedClassIds) {
      sessionQuery.class = { $in: allowedClassIds };
    }
    if (startDate || endDate) {
      sessionQuery.date = {};
      if (startDate) sessionQuery.date.$gte = new Date(startDate);
      if (endDate) sessionQuery.date.$lte = new Date(endDate);
    }

    const [sessions, totalStudents, totalFaculty] = await Promise.all([
      Session.find(sessionQuery).populate('class', 'name code').sort('-date').lean(),
      isAdmin ? User.countDocuments({ role: 'STUDENT' }) : 0,
      isAdmin ? User.countDocuments({ role: 'FACULTY' }) : 0,
    ]);

    const sessionIds = sessions.map((s) => s._id);
    const attendanceRecords = await Attendance.find({ session: { $in: sessionIds } })
      .populate('student', 'name email studentId')
      .lean();

    // Session breakdown
    const sessionBreakdown = sessions.map((session) => {
      const count = attendanceRecords.filter(
        (a) => a.session.toString() === session._id.toString()
      ).length;
      const total = session.totalStudents || 1;
      return {
        id: session._id,
        title: session.title,
        class: session.class?.name || 'N/A',
        date: session.date,
        attendance: count,
        total,
        percentage: Math.round((count / total) * 100),
      };
    });

    const avgAttendance =
      sessionBreakdown.length > 0
        ? Math.round(sessionBreakdown.reduce((s, x) => s + x.percentage, 0) / sessionBreakdown.length)
        : 0;

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DAILY_TREND_DAYS);
    const dailyMap = {};
    sessions
      .filter((s) => new Date(s.date) >= thirtyDaysAgo)
      .forEach((session) => {
        const day = new Date(session.date).toISOString().split('T')[0];
        if (!dailyMap[day]) dailyMap[day] = { total: 0, attendance: 0 };
        dailyMap[day].total += session.totalStudents || 0;
        dailyMap[day].attendance += attendanceRecords.filter(
          (a) => a.session.toString() === session._id.toString()
        ).length;
      });
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, d]) => ({
        date,
        total: d.total,
        attendance: d.attendance,
        percentage: d.total > 0 ? Math.round((d.attendance / d.total) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // At-risk students scoped to these sessions only
    const studentMap = {};
    attendanceRecords.forEach((a) => {
      const sid = a.student?._id?.toString();
      if (!sid) return;
      if (!studentMap[sid]) studentMap[sid] = { ...a.student, present: 0 };
      studentMap[sid].present++;
    });

    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const atRiskStudents = Object.values(studentMap)
      .map((s) => ({
        ...s,
        total: completedSessions,
        attendanceRate: completedSessions > 0 ? Math.round((s.present / completedSessions) * 100) : 0,
      }))
      .filter((s) => s.attendanceRate < ATTENDANCE_THRESHOLD_GOOD)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, AT_RISK_DISPLAY_LIMIT);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents: isAdmin ? totalStudents : (allowedClassIds ? sessions.reduce((acc, s) => acc + (s.totalStudents || 0), 0) : 0),
          totalFaculty,
          totalSessions: sessions.length,
          liveSessions: sessions.filter((s) => s.status === 'LIVE').length,
          averageAttendance: avgAttendance,
        },
        atRiskStudents,
        dailyTrend,
        sessionBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get student-specific attendance analytics
 */
export const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.user.role === 'STUDENT' ? req.user._id : req.params.studentId;
    
    // Get all classes the student is enrolled in
    const classes = await Class.find({ students: studentId });
    const classIds = classes.map(c => c._id);
    
    // Get all sessions for these classes
    const sessions = await Session.find({ 
      class: { $in: classIds },
      status: 'COMPLETED'
    }).sort('-date');
    
    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student: studentId,
      session: { $in: sessions.map(s => s._id) }
    }).populate('session');
    
    // Calculate per-class statistics
    const classStats = {};
    classes.forEach(cls => {
      const classSessions = sessions.filter(s => s.class.toString() === cls._id.toString());
      const classAttendance = attendanceRecords.filter(a => 
        classSessions.some(s => s._id.toString() === a.session._id.toString())
      );
      
      classStats[cls._id] = {
        className: cls.name,
        classCode: cls.code,
        totalSessions: classSessions.length,
        attended: classAttendance.length,
        percentage: classSessions.length > 0 
          ? ((classAttendance.length / classSessions.length) * 100).toFixed(2)
          : 0
      };
    });
    
    // Overall statistics
    const totalSessions = sessions.length;
    const totalAttended = attendanceRecords.length;
    const overallPercentage = totalSessions > 0 
      ? ((totalAttended / totalSessions) * 100).toFixed(2)
      : 0;
    
    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - MONTHLY_TREND_MONTHS);
    
    const monthlyData = {};
    attendanceRecords.forEach(record => {
      if (record.session && record.session.date >= sixMonthsAgo) {
        const month = record.session.date.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { attended: 0, total: 0 };
        }
        monthlyData[month].attended++;
      }
    });
    
    sessions.forEach(session => {
      if (session.date >= sixMonthsAgo) {
        const month = session.date.toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { attended: 0, total: 0 };
        }
        monthlyData[month].total++;
      }
    });
    
    const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      attended: data.attended,
      total: data.total,
      percentage: data.total > 0 ? ((data.attended / data.total) * 100).toFixed(2) : 0
    })).sort((a, b) => a.month.localeCompare(b.month));
    
    res.json({
      success: true,
      data: {
        overall: {
          totalSessions,
          totalAttended,
          percentage: parseFloat(overallPercentage),
          status: overallPercentage >= ATTENDANCE_THRESHOLD_GOOD ? 'Good' : overallPercentage >= ATTENDANCE_THRESHOLD_WARNING ? 'Warning' : 'At Risk'
        },
        byClass: Object.values(classStats),
        monthlyTrend,
        recentSessions: sessions.slice(0, RECENT_SESSIONS_LIMIT).map(s => {
          const attended = attendanceRecords.some(a => a.session._id.toString() === s._id.toString());
          return {
            id: s._id,
            title: s.title,
            date: s.date,
            attended
          };
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export attendance data as CSV
 */
export const exportAttendanceCSV = async (req, res) => {
  try {
    const {  startDate,classId, endDate } = req.query;
    
    let query = {};
    if (classId) query.class = classId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const sessions = await Session.find(query)
      .populate('class', 'name code')
      .populate('faculty', 'name email')
      .sort('date');
    
    const sessionIds = sessions.map(s => s._id);
    const attendanceRecords = await Attendance.find({ 
      session: { $in: sessionIds } 
    }).populate('student', 'name email studentId');
    
    // Build CSV
    let csv = 'Session Title,Class,Date,Student Name,Student ID,Email,Marked At,Status\n';
    
    sessions.forEach(session => {
      const sessionAttendance = attendanceRecords.filter(
        a => a.session.toString() === session._id.toString()
      );
      
      if (sessionAttendance.length === 0) {
        csv += `"${session.title}","${session.class?.name || 'N/A'}","${session.date.toISOString().split('T')[0]}","No attendance","","","",""\n`;
      } else {
        sessionAttendance.forEach(record => {
          csv += `"${session.title}","${session.class?.name || 'N/A'}","${session.date.toISOString().split('T')[0]}","${record.student.name}","${record.student.studentId || 'N/A'}","${record.student.email}","${record.markedAt.toISOString()}","Present"\n`;
        });
      }
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get class-specific detailed analytics
 */
export const getClassAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const classData = await Class.findById(id)
      .populate('students', 'name email studentId')
      .populate('faculty', 'name email');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Get all sessions for this class
    const sessions = await Session.find({ class: id }).sort('-date');
    const sessionIds = sessions.map(s => s._id);
    
    // Get all attendance records
    const attendanceRecords = await Attendance.find({ 
      session: { $in: sessionIds } 
    }).populate('student', 'name email studentId');
    
    // Calculate per-student statistics
    const studentStats = classData.students.map(student => {
      const studentAttendance = attendanceRecords.filter(
        a => a.student._id.toString() === student._id.toString()
      );
      
      const totalSessions = sessions.filter(s => s.status === 'COMPLETED').length;
      const attended = studentAttendance.length;
      const percentage = totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(2) : 0;
      
      return {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        totalSessions,
        attended,
        percentage: parseFloat(percentage),
        status: percentage >= ATTENDANCE_THRESHOLD_GOOD ? 'Good' : percentage >= ATTENDANCE_THRESHOLD_WARNING ? 'Warning' : 'At Risk'
      };
    }).sort((a, b) => a.percentage - b.percentage);
    
    // Session-wise breakdown
    const sessionBreakdown = sessions.map(session => {
      const sessionAttendance = attendanceRecords.filter(
        a => a.session.toString() === session._id.toString()
      );
      
      return {
        id: session._id,
        title: session.title,
        date: session.date,
        status: session.status,
        attended: sessionAttendance.length,
        total: classData.students.length,
        percentage: classData.students.length > 0 
          ? ((sessionAttendance.length / classData.students.length) * 100).toFixed(2)
          : 0
      };
    });
    
    res.json({
      success: true,
      data: {
        class: {
          id: classData._id,
          name: classData.name,
          code: classData.code,
          faculty: classData.faculty,
          totalStudents: classData.students.length
        },
        overview: {
          totalSessions: sessions.length,
          completedSessions: sessions.filter(s => s.status === 'COMPLETED').length,
          averageAttendance: sessionBreakdown.length > 0
            ? (sessionBreakdown.reduce((sum, s) => sum + parseFloat(s.percentage), 0) / sessionBreakdown.length).toFixed(2)
            : 0
        },
        studentStats,
        sessionBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
