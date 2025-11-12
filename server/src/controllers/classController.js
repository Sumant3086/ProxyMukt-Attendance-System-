import Class from '../models/Class.js';
import User from '../models/User.js';

/**
 * Create new class
 */
export const createClass = async (req, res) => {
  try {
    const { name, code, description, department, semester, schedule } = req.body;
    
    const newClass = await Class.create({
      name,
      code,
      description,
      faculty: req.user._id,
      department,
      semester,
      schedule,
    });
    
    await newClass.populate('faculty', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { class: newClass },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all classes (filtered by role)
 */
export const getClasses = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'FACULTY') {
      query.faculty = req.user._id;
    } else if (req.user.role === 'STUDENT') {
      query.students = req.user._id;
    }
    
    const classes = await Class.find(query)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId')
      .sort('-createdAt');
    
    res.json({
      success: true,
      data: { classes },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single class by ID
 */
export const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }
    
    res.json({
      success: true,
      data: { class: classData },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update class
 */
export const updateClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }
    
    // Check authorization
    if (req.user.role === 'FACULTY' && classData.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this class',
      });
    }
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('faculty', 'name email');
    
    res.json({
      success: true,
      message: 'Class updated successfully',
      data: { class: updatedClass },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete class
 */
export const deleteClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }
    
    await Class.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Add students to class
 */
export const addStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }
    
    // Verify students exist
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'STUDENT',
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some student IDs are invalid',
      });
    }
    
    // Add students (avoid duplicates)
    classData.students = [...new Set([...classData.students, ...studentIds])];
    await classData.save();
    
    await classData.populate('students', 'name email studentId');
    
    res.json({
      success: true,
      message: 'Students added successfully',
      data: { class: classData },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Remove student from class
 */
export const removeStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const classData = await Class.findById(req.params.id);
    
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
    
    res.json({
      success: true,
      message: 'Student removed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
