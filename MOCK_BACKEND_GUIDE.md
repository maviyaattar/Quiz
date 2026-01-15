# Mock Backend Guide

This guide explains how to use the mock backend for development and testing without requiring a real backend server.

## Overview

The Quiz application supports two modes:
- **Mock Backend Mode**: Uses `mockBackend.js` for all API operations (no server required)
- **Real Backend Mode**: Connects to actual backend API (requires running server)

## Quick Start

### Using Mock Backend (Development/Testing)

1. Open `app.js`
2. Find line ~48-51 with `USE_MOCK_BACKEND` constant
3. Set it to `true`:
   ```javascript
   const USE_MOCK_BACKEND = true;
   ```
4. Save the file
5. Open `index.html` in a browser (or use a local HTTP server)
6. The app will now use mock data!

### Using Real Backend (Production)

1. Open `app.js`
2. Find line ~48-51 with `USE_MOCK_BACKEND` constant
3. Set it to `false`:
   ```javascript
   const USE_MOCK_BACKEND = false;
   ```
4. Update `API_BASE_URL` to point to your backend server
5. Save the file
6. The app will now connect to your real backend!

## Mock Data Included

### Demo User Account
- **Email**: demo@example.com
- **Password**: demo123

### Sample Quiz
- **Quiz Code**: 123456
- **Title**: Sample Quiz
- **Questions**: 3 questions
  1. What is 2 + 2? (Answer: 4)
  2. What is the capital of France? (Answer: Paris)
  3. Which planet is closest to the Sun? (Answer: Mercury)

## Available Mock API Functions

All mock API functions are in `mockBackend.js`:

### Authentication
- `mockLogin(email, password)` - Login with credentials
- `mockRegister(name, email, password)` - Register new user

### Quiz Management
- `mockCreateQuiz(quizData, token)` - Create a new quiz
- `mockDeleteQuiz(code, token)` - Delete a quiz
- `mockJoinQuiz(code, participant)` - Join a quiz with code
- `mockGetQuestions(code)` - Get quiz questions

### Quiz Participation
- `mockSubmitQuiz(code, submission)` - Submit quiz answers
- `mockGetLeaderboard(code, token)` - Get quiz leaderboard
- `mockGetSummary(code, token)` - Get quiz summary with participants

## How It Works

When `USE_MOCK_BACKEND` is `true`, the app:
1. Imports mock functions from `mockBackend.js`
2. Calls mock functions instead of `fetch()` for API operations
3. Uses in-memory data storage (resets on page reload)
4. Simulates network delays for realistic testing

When `USE_MOCK_BACKEND` is `false`, the app:
1. Uses standard `fetch()` API calls
2. Connects to backend server at `API_BASE_URL`
3. Requires running backend with proper endpoints

## Testing Workflows

### Test User Login
1. Enable mock backend
2. Navigate to login page
3. Use credentials: demo@example.com / demo123
4. Should successfully log in and reach dashboard

### Test Quiz Joining
1. Enable mock backend
2. Click "Join Quiz"
3. Enter code: 123456
4. Fill in participant details
5. Should load sample quiz with 3 questions

### Test Quiz Creation
1. Enable mock backend
2. Login with demo account
3. Go to "Create Test" tab
4. Fill in quiz details and add questions
5. Submit - will generate a new quiz code

## Modifying Mock Data

To add or modify mock data, edit `mockBackend.js`:

### Add a New User
```javascript
mockStorage.users.push({
    id: 2,
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123'
});
```

### Add a New Quiz
```javascript
mockStorage.quizzes.push({
    id: '789012',
    code: '789012',
    title: 'My New Quiz',
    // ... other quiz properties
});
```

## Benefits of Mock Backend

✅ **No Server Required**: Develop and test without backend setup  
✅ **Fast Iteration**: Instant changes without API calls  
✅ **Offline Development**: Work without internet connection  
✅ **Predictable Data**: Consistent test data every time  
✅ **Easy Debugging**: Simple JavaScript, no network complexity  
✅ **Clean Separation**: Clear distinction between frontend and backend logic  

## Transitioning to Real Backend

When you're ready to use the real backend:

1. Set `USE_MOCK_BACKEND = false` in `app.js`
2. Update `API_BASE_URL` to your backend server URL
3. Ensure your backend has all required endpoints (see README.md)
4. No other code changes needed!

The app automatically handles the transition because all API calls go through the same conditional logic.

## Troubleshooting

**Issue**: Functions not working after enabling mock backend  
**Solution**: Make sure you saved `app.js` and refreshed the browser

**Issue**: "Module not found" error  
**Solution**: Ensure `mockBackend.js` is in the same directory as `app.js`

**Issue**: Data not persisting between reloads  
**Solution**: This is expected - mock data resets on page reload. Use localStorage for persistence if needed.

**Issue**: Mock backend not working in production  
**Solution**: Verify `USE_MOCK_BACKEND` is set to `false` for production builds

## Support

For issues or questions:
- Check `app.js` to verify the `USE_MOCK_BACKEND` flag setting
- Review `mockBackend.js` to see available mock data
- Ensure you're using a modern browser that supports ES6 modules

---

**Remember**: Mock backend is for development and testing only. Always use real backend for production deployments!
