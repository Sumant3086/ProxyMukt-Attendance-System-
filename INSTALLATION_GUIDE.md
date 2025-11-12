# Complete Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB** (v6 or higher)
   - Option A: Local installation from https://www.mongodb.com/try/download/community
   - Option B: MongoDB Atlas (cloud) from https://www.mongodb.com/cloud/atlas
   - Verify: `mongod --version` (for local)

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

4. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## Step-by-Step Installation

### Step 1: Project Setup

If you have the project files, navigate to the project directory:
```bash
cd attendance-system
```

### Step 2: Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

4. Edit `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_ACCESS_SECRET=your_super_secret_access_key_change_this
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
QR_SECRET=your_super_secret_qr_key_change_this
QR_ROTATION_INTERVAL=20000
CLIENT_URL=http://localhost:5173
```

**Important**: Change all secret keys to random, secure strings in production!

5. Start MongoDB (if using local installation):
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

6. Seed the database (optional but recommended):
```bash
npm run seed
```

This creates sample users:
- Admin: admin@example.com / admin123
- Faculty: faculty@example.com / faculty123
- Student: alice@example.com / student123

7. Start the backend server:
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
```

### Step 3: Frontend Setup

Open a new terminal window/tab.

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

4. Edit `.env` file (usually no changes needed for local development):
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the frontend development server:
```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Access the Application

1. Open your browser and navigate to: http://localhost:5173

2. You should see the login page

3. Login with one of the seeded accounts:
   - **Admin**: admin@example.com / admin123
   - **Faculty**: faculty@example.com / faculty123
   - **Student**: alice@example.com / student123

## Verification Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] MongoDB connected successfully
- [ ] Can access login page
- [ ] Can login with seeded credentials
- [ ] Dashboard loads correctly

## Common Issues and Solutions

### Issue 1: MongoDB Connection Error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
- Ensure MongoDB is running
- Check MONGODB_URI in server/.env
- For local MongoDB: Start with `mongod` command
- For MongoDB Atlas: Verify connection string and network access

### Issue 2: Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

Or change the PORT in server/.env

### Issue 3: npm Install Fails

**Error**: Various npm errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue 4: CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
- Verify CLIENT_URL in server/.env matches your frontend URL
- Ensure backend server is running
- Check browser console for exact error

### Issue 5: Camera Access Denied (QR Scanning)

**Error**: Camera not accessible

**Solution**:
- Allow camera permissions in browser
- Use HTTPS in production (required for camera access)
- Check browser settings for camera permissions
- Try a different browser

## Testing the Application

### Test Faculty Workflow

1. Login as faculty (faculty@example.com / faculty123)
2. Click "Create Class"
3. Fill in class details:
   - Name: "Test Class"
   - Code: "TEST101"
   - Department: "Computer Science"
4. Click "Create"
5. Click "Start Session" on the created class
6. You should see a rotating QR code

### Test Student Workflow

1. Open a new incognito/private window
2. Login as student (alice@example.com / student123)
3. Click "Scan QR"
4. Allow camera access
5. Point camera at the QR code from faculty session
6. Attendance should be marked

### Test Admin Workflow

1. Login as admin (admin@example.com / admin123)
2. View analytics dashboard
3. Check system metrics
4. View at-risk students

## Production Deployment

### Backend Deployment (Example: Heroku)

1. Create Heroku app:
```bash
heroku create attendance-system-api
```

2. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_ACCESS_SECRET=your_secret
heroku config:set JWT_REFRESH_SECRET=your_secret
heroku config:set QR_SECRET=your_secret
heroku config:set CLIENT_URL=https://your-frontend-url.com
```

3. Deploy:
```bash
git push heroku main
```

### Frontend Deployment (Example: Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd client
vercel
```

3. Set environment variable:
```
VITE_API_URL=https://your-backend-url.herokuapp.com/api
```

### MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all)
5. Get connection string
6. Replace in MONGODB_URI

## Development Tips

1. **Hot Reload**: Both servers support hot reload
   - Backend: Uses `--watch` flag
   - Frontend: Vite's built-in HMR

2. **Debugging**:
   - Backend: Use `console.log()` or Node.js debugger
   - Frontend: Use React DevTools and browser console

3. **Database Inspection**:
   - Use MongoDB Compass: https://www.mongodb.com/products/compass
   - Or use `mongosh` CLI

4. **API Testing**:
   - Use Postman: https://www.postman.com/
   - Or Thunder Client (VS Code extension)

5. **Code Editor**:
   - Recommended: VS Code with extensions:
     - ESLint
     - Prettier
     - ES7+ React/Redux/React-Native snippets
     - Tailwind CSS IntelliSense

## Next Steps

1. Explore the codebase
2. Read FEATURES.md for feature details
3. Check ARCHITECTURE.md for system design
4. Review API.md for endpoint documentation
5. Customize for your needs

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review error messages carefully
3. Check browser console for frontend errors
4. Check terminal for backend errors
5. Verify all environment variables are set correctly

## Security Reminders

Before deploying to production:
- [ ] Change all default secrets
- [ ] Use strong, random secret keys
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Use MongoDB Atlas with authentication
- [ ] Set NODE_ENV=production
- [ ] Review and update rate limits
- [ ] Enable security headers
- [ ] Implement proper logging
- [ ] Set up monitoring

## Congratulations! 🎉

You now have a fully functional attendance monitoring system running locally. Happy coding!
