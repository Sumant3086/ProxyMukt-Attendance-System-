import Notification from '../models/Notification.js';
import Class from '../models/Class.js';

/**
 * Send notification to specific users
 */
export const sendNotification = async (userIds, type, title, message, data = {}) => {
  try {
    const notifications = userIds.map((userId) => ({
      user: userId,
      type,
      title,
      message,
      data,
    }));

    await Notification.insertMany(notifications);
    
    // TODO: Send push notifications, emails, etc.
    console.log(`Sent ${notifications.length} notifications of type: ${type}`);
    
    return true;
  } catch (error) {
    console.error('Error sending notifications:', error);
    return false;
  }
};

/**
 * Notify students when session starts
 */
export const notifySessionStarted = async (session) => {
  try {
    const classData = await Class.findById(session.class).populate('students', '_id');
    
    if (!classData || !classData.students.length) {
      return;
    }

    const studentIds = classData.students.map((s) => s._id);

    await sendNotification(
      studentIds,
      'SESSION_STARTED',
      '🎓 Class Started!',
      `${classData.name} session has started. Join now to mark your attendance!`,
      {
        sessionId: session._id,
        classId: session.class,
        className: classData.name,
      }
    );
  } catch (error) {
    console.error('Error notifying session start:', error);
  }
};

/**
 * Notify students when session ends
 */
export const notifySessionEnded = async (session) => {
  try {
    const classData = await Class.findById(session.class).populate('students', '_id');
    
    if (!classData || !classData.students.length) {
      return;
    }

    const studentIds = classData.students.map((s) => s._id);

    await sendNotification(
      studentIds,
      'SESSION_ENDED',
      '⏰ Class Ended',
      `${classData.name} session has ended. Check your attendance status.`,
      {
        sessionId: session._id,
        classId: session.class,
        className: classData.name,
      }
    );
  } catch (error) {
    console.error('Error notifying session end:', error);
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, limit = 20) => {
  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true, readAt: new Date() }
    );
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
};

export default {
  sendNotification,
  notifySessionStarted,
  notifySessionEnded,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
