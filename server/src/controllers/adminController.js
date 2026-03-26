import User from '../models/User.js';
import Session from '../models/Session.js';

/**
 * Get all users with real DB counts
 */
export const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, totalCount, totalStudents, totalFaculty, totalSessions] = await Promise.all([
      User.find(query, 'name email role studentId department isActive createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'FACULTY' }),
      Session.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        stats: { totalStudents, totalFaculty, totalSessions },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};