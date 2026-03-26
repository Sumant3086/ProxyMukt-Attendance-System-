import User from '../models/User.js';
import Session from '../models/Session.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import { DEFAULT_PAGE_SIZE, USER_ROLES, CURSOR_PAGE_SIZE, MAX_CURSOR_PAGE_SIZE } from '../config/constants.js';

/**
 * Get all users with cursor-based pagination
 */
export const getAllUsers = async (req, res) => {
  const { cursor, limit = CURSOR_PAGE_SIZE, role, search } = req.query;
  const pageLimit = Math.min(parseInt(limit) || CURSOR_PAGE_SIZE, MAX_CURSOR_PAGE_SIZE);

  try {
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    // If cursor provided, find documents after cursor
    if (cursor) {
      query._id = { $gt: cursor };
    }

    const [users, totalCount, totalStudents, totalFaculty, totalSessions] = await Promise.all([
      User.find(query, 'name email role studentId department isActive createdAt')
        .sort({ _id: 1 })
        .limit(pageLimit + 1) // Fetch one extra to determine if there's a next page
        .lean(),
      User.countDocuments(query),
      User.countDocuments({ role: USER_ROLES.STUDENT }),
      User.countDocuments({ role: USER_ROLES.FACULTY }),
      Session.countDocuments(),
    ]);

    // Determine if there's a next page
    const hasMore = users.length > pageLimit;
    const data = hasMore ? users.slice(0, pageLimit) : users;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    res.json({
      success: true,
      data: {
        users: data,
        stats: { totalStudents, totalFaculty, totalSessions },
        pagination: {
          cursor: nextCursor,
          hasMore,
          count: data.length,
          totalCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get faculty details with their classes and students
 */
export const getFacultyDetails = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await User.findById(facultyId).select('name email department createdAt');
    if (!faculty || faculty.role !== USER_ROLES.FACULTY) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    const classes = await Class.find({ faculty: facultyId })
      .populate('students', 'name email studentId')
      .lean();

    const classIds = classes.map(c => c._id);
    const sessions = await Session.find({ class: { $in: classIds } }).lean();
    const attendanceRecords = await Attendance.find({ class: { $in: classIds } }).lean();

    const classDetails = classes.map(cls => ({
      ...cls,
      studentCount: cls.students.length,
      sessionCount: sessions.filter(s => s.class.toString() === cls._id.toString()).length,
      totalAttendance: attendanceRecords.filter(a => a.class.toString() === cls._id.toString()).length,
    }));

    res.json({
      success: true,
      data: {
        faculty,
        classes: classDetails,
        totalClasses: classes.length,
        totalStudents: classes.reduce((sum, c) => sum + c.students.length, 0),
        totalSessions: sessions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove student from a class
 */
export const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    classData.students = classData.students.filter(
      (id) => id.toString() !== studentId
    );
    await classData.save();

    // Also remove attendance records for this student in this class
    await Attendance.deleteMany({
      class: classId,
      student: studentId,
    });

    res.json({
      success: true,
      message: 'Student removed from class successfully',
      data: { class: classData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove faculty and optionally their classes
 */
export const removeFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { removeClasses = false } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== USER_ROLES.FACULTY) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    if (removeClasses) {
      // Get all classes for this faculty
      const classes = await Class.find({ faculty: facultyId });
      const classIds = classes.map(c => c._id);

      // Remove all attendance records for these classes
      await Attendance.deleteMany({ class: { $in: classIds } });

      // Remove all sessions for these classes
      await Session.deleteMany({ class: { $in: classIds } });

      // Remove the classes
      await Class.deleteMany({ faculty: facultyId });
    } else {
      // Just unassign classes from faculty
      await Class.updateMany({ faculty: facultyId }, { faculty: null });
    }

    // Deactivate the faculty user
    faculty.isActive = false;
    await faculty.save();

    res.json({
      success: true,
      message: `Faculty removed successfully${removeClasses ? ' with all classes' : ''}`,
      data: { faculty },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove student from system
 */
export const removeStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { removeFromAllClasses = true } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== USER_ROLES.STUDENT) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (removeFromAllClasses) {
      // Remove from all classes
      await Class.updateMany(
        { students: studentId },
        { $pull: { students: studentId } }
      );

      // Remove all attendance records
      await Attendance.deleteMany({ student: studentId });
    }

    // Deactivate the student user
    student.isActive = false;
    await student.save();

    res.json({
      success: true,
      message: 'Student removed successfully',
      data: { student },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all classes with cursor-based pagination
 */
export const getAllClasses = async (req, res) => {
  try {
    const { cursor, limit = CURSOR_PAGE_SIZE, search } = req.query;
    const pageLimit = Math.min(parseInt(limit) || CURSOR_PAGE_SIZE, MAX_CURSOR_PAGE_SIZE);

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    // If cursor provided, find documents after cursor
    if (cursor) {
      query._id = { $gt: cursor };
    }

    const classes = await Class.find(query)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId')
      .sort({ _id: 1 })
      .limit(pageLimit + 1) // Fetch one extra to determine if there's a next page
      .lean();

    const totalCount = await Class.countDocuments(query);

    // Determine if there's a next page
    const hasMore = classes.length > pageLimit;
    const data = hasMore ? classes.slice(0, pageLimit) : classes;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    const classesWithStats = await Promise.all(
      data.map(async (cls) => {
        const sessions = await Session.countDocuments({ class: cls._id });
        const attendance = await Attendance.countDocuments({ class: cls._id });
        return {
          ...cls,
          studentCount: cls.students.length,
          sessionCount: sessions,
          totalAttendance: attendance,
        };
      })
    );

    res.json({
      success: true,
      data: {
        classes: classesWithStats,
        pagination: {
          cursor: nextCursor,
          hasMore,
          count: data.length,
          totalCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Remove all attendance records for this class
    await Attendance.deleteMany({ class: classId });

    // Remove all sessions for this class
    await Session.deleteMany({ class: classId });

    // Delete the class
    await Class.findByIdAndDelete(classId);

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get admin dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalFaculty, totalClasses, totalSessions, totalAttendance] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.STUDENT, isActive: true }),
      User.countDocuments({ role: USER_ROLES.FACULTY, isActive: true }),
      Class.countDocuments({ isActive: true }),
      Session.countDocuments(),
      Attendance.countDocuments(),
    ]);

    // Get at-risk students
    const classes = await Class.find().populate('students');
    const atRiskStudents = [];

    for (const classData of classes) {
      const sessions = await Session.find({
        class: classData._id,
        status: { $in: ['COMPLETED', 'LIVE'] },
      });

      for (const student of classData.students) {
        const attendance = await Attendance.find({
          class: classData._id,
          student: student._id,
        });

        const percentage = sessions.length > 0
          ? (attendance.length / sessions.length) * 100
          : 0;

        if (percentage < 75 && sessions.length > 0) {
          atRiskStudents.push({
            studentId: student._id,
            studentName: student.name,
            className: classData.name,
            percentage: percentage.toFixed(2),
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalFaculty,
          totalClasses,
          totalSessions,
          totalAttendance,
        },
        atRiskStudents: atRiskStudents.slice(0, 20),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};