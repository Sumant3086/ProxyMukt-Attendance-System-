import axios from 'axios';

/**
 * Get Zoom OAuth token using Server-to-Server OAuth
 */
const getZoomAccessToken = async () => {
  try {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      throw new Error('Zoom credentials not configured');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Zoom');
  }
};

/**
 * Create a Zoom meeting
 */
export const createZoomMeeting = async (meetingData) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: meetingData.topic || 'Class Session',
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime,
        duration: meetingData.duration || 60,
        timezone: 'UTC',
        agenda: meetingData.agenda || 'Attendance tracking enabled',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: false,
          audio: 'both',
          auto_recording: 'none',
          approval_type: 0, // Automatically approve
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      meetingId: response.data.id,
      meetingLink: response.data.join_url,
      meetingPassword: response.data.password,
      startUrl: response.data.start_url,
    };
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
};

/**
 * Get meeting participants
 */
export const getZoomMeetingParticipants = async (meetingId) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.get(
      `https://api.zoom.us/v2/metrics/meetings/${meetingId}/participants`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.participants.map((p) => ({
      name: p.name,
      email: p.user_email,
      joinTime: new Date(p.join_time),
      leaveTime: p.leave_time ? new Date(p.leave_time) : null,
      duration: p.duration,
    }));
  } catch (error) {
    console.error('Error getting participants:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Get meeting details
 */
export const getZoomMeetingDetails = async (meetingId) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      topic: response.data.topic,
      startTime: new Date(response.data.start_time),
      duration: response.data.duration,
      status: response.data.status,
      joinUrl: response.data.join_url,
    };
  } catch (error) {
    console.error('Error getting meeting details:', error.response?.data || error.message);
    throw new Error('Failed to get meeting details');
  }
};

/**
 * End a Zoom meeting
 */
export const endZoomMeeting = async (meetingId) => {
  try {
    const accessToken = await getZoomAccessToken();

    await axios.put(
      `https://api.zoom.us/v2/meetings/${meetingId}/status`,
      {
        action: 'end',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return true;
  } catch (error) {
    console.error('Error ending meeting:', error.response?.data || error.message);
    throw new Error('Failed to end meeting');
  }
};

/**
 * Get past meeting participants (after meeting ends)
 */
export const getPastMeetingParticipants = async (meetingId) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.get(
      `https://api.zoom.us/v2/past_meetings/${meetingId}/participants`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.participants.map((p) => ({
      name: p.name,
      email: p.user_email,
      joinTime: new Date(p.join_time),
      leaveTime: new Date(p.leave_time),
      duration: p.duration,
      attentiveness_score: p.attentiveness_score,
    }));
  } catch (error) {
    console.error('Error getting past participants:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Sync Zoom participants with our database
 */
export const syncZoomParticipants = async (onlineSessionId, meetingId) => {
  try {
    const participants = await getZoomMeetingParticipants(meetingId);

    // Update OnlineSession with participant data
    const OnlineSession = (await import('../models/OnlineSession.js')).default;
    const User = (await import('../models/User.js')).default;

    const onlineSession = await OnlineSession.findById(onlineSessionId);
    if (!onlineSession) {
      throw new Error('Online session not found');
    }

    // Match Zoom participants with our students by email
    for (const zoomParticipant of participants) {
      const student = await User.findOne({ email: zoomParticipant.email, role: 'STUDENT' });

      if (student) {
        // Check if participant already exists
        const existingParticipant = onlineSession.participants.find(
          (p) => p.student.toString() === student._id.toString()
        );

        if (existingParticipant) {
          // Update existing participant
          existingParticipant.leaveTime = zoomParticipant.leaveTime;
          existingParticipant.duration = zoomParticipant.duration;
        } else {
          // Add new participant
          onlineSession.participants.push({
            student: student._id,
            joinTime: zoomParticipant.joinTime,
            leaveTime: zoomParticipant.leaveTime,
            duration: zoomParticipant.duration,
          });
        }
      }
    }

    await onlineSession.save();
    return onlineSession;
  } catch (error) {
    console.error('Error syncing participants:', error);
    throw error;
  }
};

export default {
  createZoomMeeting,
  getZoomMeetingParticipants,
  getZoomMeetingDetails,
  endZoomMeeting,
  getPastMeetingParticipants,
  syncZoomParticipants,
};
