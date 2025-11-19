# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT",
  "studentId": "STU001",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "jwt_token"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Logout
```http
POST /api/auth/logout
```
**Auth Required:** Yes

### Get Profile
```http
GET /api/auth/profile
```
**Auth Required:** Yes

### Refresh Token
```http
POST /api/auth/refresh
```

---

## Class Endpoints

### Create Class
```http
POST /api/classes
```
**Auth Required:** Yes (FACULTY, ADMIN)

**Body:**
```json
{
  "name": "Data Structures",
  "code": "CS201",
  "description": "Introduction to data structures",
  "department": "Computer Science",
  "semester": "Fall 2024",
  "schedule": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:30",
      "room": "Room 101"
    }
  ]
}
```

### Get All Classes
```http
GET /api/classes
```
**Auth Required:** Yes

### Get Class by ID
```http
GET /api/classes/:id
```
**Auth Required:** Yes

### Update Class
```http
PUT /api/classes/:id
```
**Auth Required:** Yes (FACULTY, ADMIN)

### Delete Class
```http
DELETE /api/classes/:id
```
**Auth Required:** Yes (ADMIN)

### Add Students to Class
```http
POST /api/classes/:id/students
```
**Auth Required:** Yes (FACULTY, ADMIN)

**Body:**
```json
{
  "studentIds": ["user_id_1", "user_id_2"]
}
```

### Remove Student from Class
```http
DELETE /api/classes/:id/students/:studentId
```
**Auth Required:** Yes (FACULTY, ADMIN)

---

## Session Endpoints

### Create Session
```http
POST /api/sessions
```
**Auth Required:** Yes (FACULTY, ADMIN)

**Body:**
```json
{
  "classId": "class_id",
  "title": "Lecture 1: Introduction",
  "date": "2024-11-19",
  "startTime": "2024-11-19T09:00:00Z",
  "location": {
    "room": "Room 101",
    "building": "Main Building",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 100,
    "geofencingEnabled": true
  }
}
```

### Start Session
```http
POST /api/sessions/:id/start
```
**Auth Required:** Yes (FACULTY, ADMIN)

### End Session
```http
POST /api/sessions/:id/end
```
**Auth Required:** Yes (FACULTY, ADMIN)

### Get QR Token
```http
GET /api/sessions/:id/qr
```
**Auth Required:** Yes

### Get All Sessions
```http
GET /api/sessions?classId=xxx&status=LIVE
```
**Auth Required:** Yes

### Get Session by ID
```http
GET /api/sessions/:id
```
**Auth Required:** Yes

### Get Session Attendance
```http
GET /api/sessions/:id/attendance
```
**Auth Required:** Yes (FACULTY, ADMIN)

---

## Attendance Endpoints

### Mark Attendance
```http
POST /api/attendance/mark
```
**Auth Required:** Yes (STUDENT)

**Body:**
```json
{
  "qrToken": "qr_token_string",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  }
}
```

### Check Nearby Session
```http
POST /api/attendance/check-nearby
```
**Auth Required:** Yes (STUDENT)

**Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Get Student Attendance
```http
GET /api/attendance/my-attendance?classId=xxx
```
**Auth Required:** Yes (STUDENT)

### Get Attendance Stats
```http
GET /api/attendance/stats?classId=xxx
```
**Auth Required:** Yes (STUDENT)

### Get Class Attendance Report
```http
GET /api/attendance/class/:classId/report
```
**Auth Required:** Yes (FACULTY, ADMIN)

### Get Analytics
```http
GET /api/attendance/analytics
```
**Auth Required:** Yes (ADMIN)

---

## Analytics Endpoints

### Get Attendance Analytics
```http
GET /api/analytics/attendance?startDate=2024-01-01&endDate=2024-12-31
```
**Auth Required:** Yes (FACULTY, ADMIN)

### Get Class Analytics
```http
GET /api/analytics/class/:id
```
**Auth Required:** Yes (FACULTY, ADMIN)

### Get Student Analytics
```http
GET /api/analytics/student
GET /api/analytics/student/:studentId
```
**Auth Required:** Yes

### Export Attendance CSV
```http
GET /api/analytics/export/csv?classId=xxx&startDate=2024-01-01&endDate=2024-12-31
```
**Auth Required:** Yes (FACULTY, ADMIN)

---

## Audit Log Endpoints

### Get Audit Logs
```http
GET /api/audit?action=LOGIN&startDate=2024-01-01&limit=50
```
**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `action`: Filter by action type
- `userId`: Filter by user
- `startDate`: Start date filter
- `endDate`: End date filter
- `limit`: Number of records (default: 50)

### Get Audit Log by ID
```http
GET /api/audit/:id
```
**Auth Required:** Yes (ADMIN)

---

## Online Session Endpoints

### Create Online Session
```http
POST /api/online-sessions
```
**Auth Required:** Yes (FACULTY, ADMIN)

**Body:**
```json
{
  "sessionId": "session_id",
  "platform": "ZOOM",
  "meetingLink": "https://zoom.us/j/123456789",
  "meetingId": "123456789",
  "meetingPassword": "password"
}
```

### Get Online Session
```http
GET /api/online-sessions/:id
```
**Auth Required:** Yes

### Join Online Session
```http
POST /api/online-sessions/:id/join
```
**Auth Required:** Yes (STUDENT)

### Leave Online Session
```http
POST /api/online-sessions/:id/leave
```
**Auth Required:** Yes (STUDENT)

### Process Attendance
```http
POST /api/online-sessions/:id/process-attendance
```
**Auth Required:** Yes (FACULTY, ADMIN)

---

## Zoom Endpoints

### Create Zoom Meeting
```http
POST /api/zoom/create-meeting
```
**Auth Required:** Yes (FACULTY, ADMIN)

**Body:**
```json
{
  "sessionId": "session_id",
  "topic": "Data Structures Lecture",
  "startTime": "2024-11-19T09:00:00Z",
  "duration": 60,
  "agenda": "Introduction to linked lists"
}
```

### Get Meeting Participants
```http
GET /api/zoom/meeting/:meetingId/participants
```
**Auth Required:** Yes (FACULTY, ADMIN)

### Sync Participants
```http
POST /api/zoom/sync-participants
```
**Auth Required:** Yes (FACULTY, ADMIN)

**Body:**
```json
{
  "onlineSessionId": "online_session_id",
  "meetingId": "zoom_meeting_id"
}
```

### End Meeting
```http
POST /api/zoom/meeting/:meetingId/end
```
**Auth Required:** Yes (FACULTY, ADMIN)

---

## Notification Endpoints

### Get Notifications
```http
GET /api/notifications
```
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 5
  }
}
```

### Mark as Read
```http
PUT /api/notifications/:id/read
```
**Auth Required:** Yes

### Mark All as Read
```http
PUT /api/notifications/read-all
```
**Auth Required:** Yes

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

- **Limit:** 500 requests per 15 minutes per IP
- **Headers:**
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## WebSocket Events

### QR Code Updates
```javascript
// Connect
const socket = io('http://localhost:5000');

// Join session
socket.emit('join-session', sessionId);

// Listen for QR updates
socket.on('qr-update', (data) => {
  console.log('New QR Token:', data.qrToken);
});

// Leave session
socket.emit('leave-session', sessionId);
```

---

## Notes

- All timestamps are in ISO 8601 format
- All coordinates use decimal degrees
- Distances are in meters
- Durations are in minutes
- All IDs are MongoDB ObjectIDs
