# Maviya Attar Quiz Platform

A complete, mobile-first responsive quiz application built with vanilla HTML, CSS, and JavaScript (no frameworks). This is a frontend-only demo application that runs entirely in the browser without requiring a backend server.

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
- **Authentication**: Login/register system (demo credentials available)
- **Dashboard**: Three main sections
  - **Create Test**: Build quizzes with custom questions and options
  - **My Tests**: Manage all your quizzes
  - **Profile**: Personalize your account
- **Quiz Management**:
  - Set title, description, and time limits
  - Add/delete questions dynamically
  - Multiple choice options
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
├── app.js          # Application logic with mock data
└── README.md       # Documentation
```

## 🛠️ Setup & Installation

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)

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

## 🎯 Usage

### Demo Credentials

**Demo User Account:**
- Email: `demo@example.com`
- Password: `demo123`

**Sample Quiz:**
- Quiz Code: `123456`
- Questions: 3 sample questions

### For Participants

1. Click "Join Quiz" on the landing page
2. Enter the 6-digit quiz code (try `123456` for demo)
3. Fill in your details (name, roll number, branch)
4. Answer the questions within the time limit
5. Submit and view your score

### For Creators

1. Click "Create Quiz" on the landing page
2. Login with demo credentials or register a new account
3. Navigate to "Create Test" in the dashboard
4. Fill in quiz details and add questions
5. Submit to generate a unique quiz code
6. Share the code with participants
7. View results and leaderboard from "My Tests"

## 💾 Data Storage

This application uses:
- **In-memory storage**: Quiz data and submissions during the current session
- **localStorage**: User authentication tokens and created quiz tracking

**Note**: All data is stored locally in your browser. Refreshing the page will reset quiz data but preserve your created quizzes list and authentication state.

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

### Adding More Demo Quizzes

Edit the `mockStorage.quizzes` array in `app.js` to add more sample quizzes.

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

- Built as a learning project and frontend demo
- Designed with mobile-first principles
- No external frameworks used - vanilla JavaScript only

---

Made with ❤️ by Maviya Attar