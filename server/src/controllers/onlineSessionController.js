import OnlineSession from '../models/OnlineSession.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import { createAuditLog } from '../middleware/auditLogger.js';

/**
 * Create online session (Zoom/Meet/Teams/WebRTC)
 */
export const createOnlineSession = async (req, res) => {
  try {
    const { sessionId, platform, meetingLink, meetingPassword } = req.body;

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Check if online session already exists
    const existing = await OnlineSession.findOne({ session: sessionId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Online session already exists for this session',
      });
    }

    const onlineSession = await OnlineSession.create({
      session: sessionId,
      platform,
      meetingLink,
      meetingPassword,
      meetingId: generateMeetingId(),
    });

    await createAuditLog(
      req,
      'SESSION_CREATE',
      'OnlineSession',
      onlineSession._id,
      { platform, sessionId }
    );

    res.status(201).json({
      success: true,
      data: { onlineSession },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Start online session
 */
export const startOnlineSession = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id);
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    onlineSession.status = 'LIVE';
    onlineSession.startTime = new Date();
    await onlineSession.save();

    await createAuditLog(
      req,
      'SESSION_START',
      'OnlineSession',
      onlineSession._id,
      { platform: onlineSession.platform }
    );

    res.json({
      success: true,
      data: { onlineSession },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * End online session and process attendance
 */
export const endOnlineSession = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id).populate('session');
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    onlineSession.status = 'ENDED';
    onlineSession.endTime = new Date();

    // Calculate duration
    if (onlineSession.startTime) {
      const durationMs = onlineSession.endTime - onlineSession.startTime;
      onlineSession.duration = Math.floor(durationMs / 60000); // minutes
    }

    // Process attendance based on duration
    const attendanceThreshold = onlineSession.duration * 0.75; // 75% of class time

    for (const participant of onlineSession.participants) {
      // Calculate participant duration
      if (participant.leaveTime) {
        const participantDuration = (participant.leaveTime - participant.joinTime) / 60000;
        participant.duration = Math.floor(participantDuration);

        // Determine attendance status
        let status = 'ABSENT';
        if (participantDuration >= attendanceThreshold) {
          status = 'PRESENT';
        } else if (participantDuration >= attendanceThreshold * 0.5) {
          status = 'LATE';
        }

        // Create or update attendance record
        await Attendance.findOneAndUpdate(
          {
            session: onlineSession.session._id,
            student: participant.student,
          },
          {
            session: onlineSession.session._id,
            student: participant.student,
            class: onlineSession.session.class,
            status,
            attendanceSource: onlineSession.platform,
            qrToken: 'ONLINE_SESSION',
            onlineSessionData: {
              joinTime: participant.joinTime,
              leaveTime: participant.leaveTime,
              duration: participant.duration,
              engagementScore: participant.engagementScore,
            },
            markedAt: participant.joinTime,
          },
          { upsert: true, new: true }
        );
      }
    }

    await onlineSession.save();

    await createAuditLog(
      req,
      'SESSION_END',
      'OnlineSession',
      onlineSession._id,
      {
        platform: onlineSession.platform,
        duration: onlineSession.duration,
        participants: onlineSession.participants.length,
      }
    );

    res.json({
      success: true,
      data: { onlineSession },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Student joins online session
 */
export const joinOnlineSession = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id);
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    if (onlineSession.status !== 'LIVE') {
      return res.status(400).json({
        success: false,
        message: 'Session is not live',
      });
    }

    // Check if already joined
    const existingParticipant = onlineSession.participants.find(
      (p) => p.student.toString() === req.user._id.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this session',
      });
    }

    // Add participant
    onlineSession.participants.push({
      student: req.user._id,
      joinTime: new Date(),
    });

    await onlineSession.save();

    res.json({
      success: true,
      message: 'Joined session successfully',
      data: { onlineSession },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Student leaves online session
 */
export const leaveOnlineSession = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id);
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    // Find participant
    const participant = onlineSession.participants.find(
      (p) => p.student.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'Not joined in this session',
      });
    }

    // Update leave time
    participant.leaveTime = new Date();

    // Calculate duration
    const durationMs = participant.leaveTime - participant.joinTime;
    participant.duration = Math.floor(durationMs / 60000); // minutes

    await onlineSession.save();

    res.json({
      success: true,
      message: 'Left session successfully',
      data: { duration: participant.duration },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update participant engagement
 */
export const updateEngagement = async (req, res) => {
  try {
    const { id } = req.params;
    const { cameraStatus, micStatus, tabSwitches, chatMessages, attentionTime } = req.body;

    const onlineSession = await OnlineSession.findById(id);
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    // Find participant
    const participant = onlineSession.participants.find(
      (p) => p.student.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'Not joined in this session',
      });
    }

    // Update engagement data
    if (cameraStatus) participant.cameraStatus = cameraStatus;
    if (micStatus) participant.micStatus = micStatus;
    if (tabSwitches !== undefined) participant.tabSwitches = tabSwitches;
    if (chatMessages !== undefined) participant.chatMessages = chatMessages;
    if (attentionTime !== undefined) participant.attentionTime = attentionTime;

    // Calculate engagement score
    participant.engagementScore = calculateEngagementScore(participant);

    await onlineSession.save();

    res.json({
      success: true,
      data: { engagementScore: participant.engagementScore },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get online session details
 */
export const getOnlineSession = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id)
      .populate('session')
      .populate('participants.student', 'name email studentId');

    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    res.json({
      success: true,
      data: { onlineSession },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper functions
function generateMeetingId() {
  return `MTG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateEngagementScore(participant) {
  let score = 0;

  // Camera on: 30 points
  if (participant.cameraStatus === 'ON') score += 30;
  else if (participant.cameraStatus === 'PARTIAL') score += 15;

  // Mic usage: 20 points
  if (participant.micStatus === 'ON') score += 20;
  else if (participant.micStatus === 'PARTIAL') score += 10;

  // Low tab switches: 20 points
  if (participant.tabSwitches <= 5) score += 20;
  else if (participant.tabSwitches <= 10) score += 10;

  // Chat participation: 15 points
  if (participant.chatMessages >= 5) score += 15;
  else if (participant.chatMessages >= 2) score += 10;
  else if (participant.chatMessages >= 1) score += 5;

  // Attention time: 15 points
  const attentionRatio = participant.attentionTime / (participant.duration || 1);
  if (attentionRatio >= 0.9) score += 15;
  else if (attentionRatio >= 0.7) score += 10;
  else if (attentionRatio >= 0.5) score += 5;

  return Math.min(score, 100);
}

export default {
  createOnlineSession,
  startOnlineSession,
  endOnlineSession,
  joinOnlineSession,
  leaveOnlineSession,
  updateEngagement,
  getOnlineSession,
};
