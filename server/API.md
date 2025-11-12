# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT",
  "studentId": "STU001",
  "department": "Computer Science"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {...},
    "accessToken": "jwt_token"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "accessToken": "jwt_token"
  }
}
```

### Refresh Token
```
POST /auth/refresh
Cookie: refreshToken=...

Response: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Profile
```
GET /auth/profile
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {...}
  }
}
```

## Class Endpoints

### Create Class (Faculty/Admin)
```
POST /classes
Authorization: Bearer {accessToken}
Content-Type: application/json

Body:
{
  "name": "Data Structures",
  "code": "CS201",
  "description": "Introduction to data structures",
  "department": "Computer Science",
  "semester": "Fall 2024"
}

Response: 201 Created
```

### Get All Classes
```
GET /classes
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "classes": [...]
  }
}
```

### Get Class by ID
```
GET /classes/:id
Authorization: Bearer {accessToken}

Response: 200 OK
```

### Update Class
```
PUT /classes/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

Body: {...}

Response: 200 OK
```

### Add Students to Class
```
POST /classes/:id/students
Authorization: Bearer {accessToken}
Content-Type: application/json

Body:
{
  "studentIds": ["userId1", "userId2"]
}

Response: 200 OK
```

## Session Endpoints

### Create Session (Faculty/Admin)
```
POST /sessions
Authorization: Bearer {accessToken}
Content-Type: application/json

Body:
{
  "classId": "classId",
  "title": "Lecture 1",
  "date": "2024-01-15",
  "startTime": "2024-01-15T10:00:00Z"
}

Response: 201 Created
```

### Start Session
```
POST /sessions/:id/start
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "message": "Session started successfully",
  "data": {
    "session": {...}
  }
}
```

### End Session
```
POST /sessions/:id/end
Authorization: Bearer {accessToken}

Response: 200 OK
```

### Get QR Token
```
GET /sessions/:id/qr
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "qrToken": "base64_encoded_token.signature"
  }
}
```

### Get Session Attendance
```
GET /sessions/:id/attendance
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "session": {...},
    "attendance": [...],
    "summary": {
      "total": 30,
      "present": 25,
      "absent": 5,
      "percentage": "83.33"
    }
  }
}
```

## Attendance Endpoints

### Mark Attendance (Student)
```
POST /attendance/mark
Authorization: Bearer {accessToken}
Content-Type: application/json

Body:
{
  "qrToken": "token_from_qr_code",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}

Response: 201 Created
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "attendance": {...}
  }
}
```

### Get Student Attendance
```
GET /attendance/my-attendance?classId=classId
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "attendance": [...]
  }
}
```

### Get Attendance Statistics
```
GET /attendance/stats?classId=classId
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "totalSessions": 20,
    "attendedSessions": 18,
    "missedSessions": 2,
    "percentage": "90.00"
  }
}
```

### Get Class Attendance Report (Faculty/Admin)
```
GET /attendance/class/:classId/report
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "class": {...},
    "report": [
      {
        "student": {...},
        "totalSessions": 20,
        "attended": 15,
        "missed": 5,
        "percentage": "75.00",
        "status": "GOOD"
      }
    ]
  }
}
```

### Get Analytics (Admin)
```
GET /attendance/analytics
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 100,
      "totalClasses": 10,
      "totalSessions": 200,
      "totalAttendance": 1800
    },
    "atRiskStudents": [...]
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## WebSocket Events (Socket.IO)

### Join Session Room
```javascript
socket.emit('join-session', sessionId);
```

### Leave Session Room
```javascript
socket.emit('leave-session', sessionId);
```

### Receive QR Update
```javascript
socket.on('qr-update', (data) => {
  console.log(data.qrToken);
});
```

QR tokens are automatically emitted every 20 seconds to all clients in the session room.
