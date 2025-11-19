import {
  createZoomMeeting,
  getZoomMeetingParticipants,
  syncZoomParticipants,
  endZoomMeeting,
  getPastMeetingParticipants,
} from '../services/zoomService.js';
import OnlineSession from '../models/OnlineSession.js';
import Session from '../models/Session.js';
import { createAuditLog } from '../middleware/auditLogger.js';

/**
 * Create Zoom meeting and link to session
 */
export const createZoomSession = async (req, res) => {
  try {
    const { sessionId, topic, duration } = req.body;

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Create Zoom meeting
    const zoomMeeting = await createZoomMeeting({
      topic: topic || session.title,
      startTime: session.startTime,
      duration: duration || 60,
      agenda: `Attendance tracking for ${session.title}`,
    });

    // Create online session in our database
    const onlineSession = await OnlineSession.create({
      session: sessionId,
      platform: 'ZOOM',
      meetingId: zoomMeeting.meetingId.toString(),
      meetingLink: zoomMeeting.meetingLink,
      meetingPassword: zoomMeeting.meetingPassword,
      status: 'SCHEDULED',
    });

    await createAuditLog(
      req,
      'SESSION_CREATE',
      'OnlineSession',
      onlineSession._id,
      {
        platform: 'ZOOM',
        meetingId: zoomMeeting.meetingId,
        sessionId,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Zoom meeting created successfully',
      data: {
        onlineSession,
        zoomMeeting: {
          ...zoomMeeting,
          startUrl: zoomMeeting.startUrl, // For faculty to start meeting
        },
      },
    });
  } catch (error) {
    console.error('Error creating Zoom session:', error);
    
    // Check if it's a scope error
    if (error.message.includes('scopes') || error.message.includes('Invalid access token')) {
      return res.status(400).json({
        success: false,
        message: 'Zoom app missing required permissions. Please add these scopes in your Zoom App: meeting:write:meeting, meeting:write:meeting:admin',
        error: error.message,
        setupInstructions: 'Go to https://marketplace.zoom.us/develop/apps → Your App → Scopes → Add Scopes',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Zoom meeting',
    });
  }
};

/**
 * Sync Zoom participants with our database
 */
export const syncZoomSession = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id);
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    if (onlineSession.platform !== 'ZOOM') {
      return res.status(400).json({
        success: false,
        message: 'This is not a Zoom session',
      });
    }

    // Sync participants from Zoom
    const updatedSession = await syncZoomParticipants(id, onlineSession.meetingId);

    res.json({
      success: true,
      message: 'Participants synced successfully',
      data: { onlineSession: updatedSession },
    });
  } catch (error) {
    console.error('Error syncing Zoom session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync participants',
    });
  }
};

/**
 * Get live Zoom meeting participants
 */
export const getZoomParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id);
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    if (onlineSession.platform !== 'ZOOM') {
      return res.status(400).json({
        success: false,
        message: 'This is not a Zoom session',
      });
    }

    // Get live participants from Zoom
    const participants = await getZoomMeetingParticipants(onlineSession.meetingId);

    res.json({
      success: true,
      data: { participants },
    });
  } catch (error) {
    console.error('Error getting Zoom participants:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get participants',
    });
  }
};

/**
 * End Zoom meeting and process attendance
 */
export const endZoomSession = async (req, res) => {
  try {
    const { id } = req.params;

    const onlineSession = await OnlineSession.findById(id).populate('session');
    if (!onlineSession) {
      return res.status(404).json({
        success: false,
        message: 'Online session not found',
      });
    }

    if (onlineSession.platform !== 'ZOOM') {
      return res.status(400).json({
        success: false,
        message: 'This is not a Zoom session',
      });
    }

    // Sync final participants from Zoom
    await syncZoomParticipants(id, onlineSession.meetingId);

    // End Zoom meeting
    try {
      await endZoomMeeting(onlineSession.meetingId);
    } catch (error) {
      console.warn('Could not end Zoom meeting (may already be ended):', error.message);
    }

    // Get past meeting participants for final data
    const pastParticipants = await getPastMeetingParticipants(onlineSession.meetingId);

    // Update session status
    onlineSession.status = 'ENDED';
    onlineSession.endTime = new Date();

    // Calculate duration
    if (onlineSession.startTime) {
      const durationMs = onlineSession.endTime - onlineSession.startTime;
      onlineSession.duration = Math.floor(durationMs / 60000);
    }

    // Process attendance based on duration
    const Attendance = (await import('../models/Attendance.js')).default;
    const attendanceThreshold = onlineSession.duration * 0.75;

    for (const participant of onlineSession.participants) {
      if (participant.leaveTime) {
        const participantDuration = (participant.leaveTime - participant.joinTime) / 60000;
        participant.duration = Math.floor(participantDuration);

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
            attendanceSource: 'ZOOM',
            qrToken: 'ZOOM_AUTO',
            onlineSessionData: {
              joinTime: participant.joinTime,
              leaveTime: participant.leaveTime,
              duration: participant.duration,
              engagementScore: participant.engagementScore || 0,
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
        platform: 'ZOOM',
        duration: onlineSession.duration,
        participants: onlineSession.participants.length,
        attendanceProcessed: true,
      }
    );

    res.json({
      success: true,
      message: 'Zoom session ended and attendance processed',
      data: { onlineSession },
    });
  } catch (error) {
    console.error('Error ending Zoom session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end session',
    });
  }
};

export default {
  createZoomSession,
  syncZoomSession,
  getZoomParticipants,
  endZoomSession,
};
