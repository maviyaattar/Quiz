# Maviya Attar Quiz Platform

A complete, mobile-first responsive quiz application built with vanilla HTML, CSS, and JavaScript (no frameworks). Create interactive quizzes and participate in real-time assessments with built-in anti-cheat features.

## 🚀 Features

### For Participants (Join Quiz)
- **Easy Access**: Join quizzes using a 6-digit code
- **User Details**: Enter name, roll number, and branch
- **Interactive Quiz Interface**: Clean UI with countdown timer
- **Anti-Cheat System**:
  - Tab switching detection with warnings
  - Auto-submit after 3 tab switches
  - Right-click disabled during quiz
  - Copy/paste disabled
  - Developer tools shortcuts disabled
- **Real-time Results**: See your score immediately after submission

### For Creators (Create Quiz)
- **Authentication**: Secure login/register system
- **Dashboard**: Three main sections
  - **Create Test**: Build quizzes with custom questions and options
  - **My Tests**: Manage all your quizzes
  - **Profile**: Personalize your account
- **Quiz Management**:
  - Set title, description, and time limits
  - Add/delete questions dynamically
  - Multiple choice options
  - Start/stop tests
  - View results and leaderboards
  - Track participants
- **Theme Support**: Light and dark themes

### UI/UX Features
- ✨ Mobile-first responsive design
- 🎨 Smooth animations and transitions
- 🔔 Alert notification system
- ⏳ Skeleton loaders for better UX
- 🌙 Dark mode support
- 📱 Works on all devices
- 🚫 Custom 404 page

## 📦 Project Structure

```
Quiz/
├── index.html      # Main HTML structure
├── styles.css      # All styling (mobile-first)
├── app.js          # Application logic
└── README.md       # Documentation
```

## 🛠️ Setup & Installation

### Prerequisites
- A web browser (Chrome, Firefox, Safari, Edge)
- A backend server (see Backend Integration)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/maviyaattar/Quiz.git
cd Quiz
```

2. Serve the files using any HTTP server:

**Using Python:**
```bash
python3 -m http.server 8080
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8080
```

**Using PHP:**
```bash
php -S localhost:8080
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

## 🔧 Backend Integration

The frontend is configured to work with a Quiz backend API. Update the API URL in `app.js`:

```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Required Backend Endpoints

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

**Quiz Management:**
- `POST /api/quiz/join/{code}` - Join a quiz
- `POST /api/quiz/submit` - Submit quiz answers
- `POST /api/quiz/create` - Create a new quiz
- `GET /api/quiz/my-tests` - Get creator's tests
- `GET /api/quiz/{id}/results` - Get quiz results
- `PUT /api/quiz/{id}/status` - Update quiz status
- `DELETE /api/quiz/{id}` - Delete a quiz

## 🎯 Usage

### For Participants

1. Click "Join Quiz" on the landing page
2. Enter the 6-digit quiz code
3. Fill in your details (name, roll number, branch)
4. Answer the questions within the time limit
5. Submit and view your score

### For Creators

1. Click "Create Quiz" on the landing page
2. Login or register an account
3. Navigate to "Create Test" in the dashboard
4. Fill in quiz details and add questions
5. Submit to generate a unique quiz code
6. Share the code with participants
7. Start the quiz from "My Tests"
8. View results and leaderboard after completion

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --success-color: #10b981;
    /* ... more colors */
}
```

### Modifying Anti-Cheat Settings

Adjust the tab switch limit in `app.js`:

```javascript
// Change from 3 to your desired limit
if (state.tabSwitchCount >= 3) {
    submitQuiz(true);
}
```

## 🔒 Security Features

- **Server-side Score Calculation**: Prevents client-side manipulation
- **JWT Authentication**: Secure user sessions
- **Anti-Cheat Measures**: Multiple layers of protection
- **Input Validation**: Form validation on all inputs
- **XSS Protection**: Proper data sanitization

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Maviya Attar**
- GitHub: [@maviyaattar](https://github.com/maviyaattar)

## 🙏 Acknowledgments

- Built as part of a learning project
- Designed with mobile-first principles
- No external frameworks used - vanilla JavaScript only

---

Made with ❤️ by Maviya Attar