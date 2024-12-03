# Firebase Setup Guide

## Prerequisites
- Firebase account
- Node.js and npm installed
- Application Tracker project cloned

## Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "application-tracker")
4. Follow the setup wizard

### 2. Enable Realtime Database
1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose region
4. Start in test mode (you can adjust security rules later)

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Under "Your apps", click web icon (</>)
3. Register app with a nickname
4. Copy the configuration object:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Configure Application
1. Create `.env` file in project root:
```env
VUE_APP_FIREBASE_API_KEY=your-api-key
VUE_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VUE_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VUE_APP_FIREBASE_PROJECT_ID=your-project-id
VUE_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VUE_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VUE_APP_FIREBASE_APP_ID=your-app-id
```

2. Add `.env` to `.gitignore` to keep your credentials secure

### 5. Database Structure
The application expects the following database structure:
```json
{
  "responses": {
    "$responseId": {
      "timestamp": "ISO-8601-timestamp",
      "jobBoard": "string"
    }
  },
  "jobBoards": [
    "string"
  ]
}
```

### 6. Security Rules
Basic security rules for Realtime Database:
```json
{
  "rules": {
    ".read": true,  // For development only
    ".write": true, // For development only
    "responses": {
      "$responseId": {
        ".validate": "newData.hasChildren(['timestamp', 'jobBoard'])"
      }
    }
  }
}
```

**Note:** These are development rules. For production, implement proper authentication and stricter security rules.

## Troubleshooting

### Common Issues:
1. **Database Connection Failed**
   - Check if your Firebase configuration is correct
   - Verify your internet connection
   - Ensure database rules allow access

2. **Data Not Syncing**
   - Check console for errors
   - Verify database path structure
   - Confirm write permissions

3. **Environment Variables Not Loading**
   - Ensure `.env` file is in project root
   - Restart development server
   - Check variable naming (must start with VUE_APP_)
