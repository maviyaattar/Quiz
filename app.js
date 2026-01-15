// Application State
const state = {
    currentPage: 'landingPage',
    currentUser: null,
    currentQuiz: null,
    quizCode: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timer: null,
    timeRemaining: 0,
    tabSwitchCount: 0,
    testData: [],
    questionCount: 0
};

// Constants
const DEFAULT_QUIZ_TIME_SECONDS = 600; // 10 minutes fallback

// Mock Data Storage Keys
const STORAGE_KEYS = {
    USERS: 'quiz_mock_users',
    QUIZZES: 'quiz_mock_quizzes',
    RESULTS: 'quiz_mock_results',
    CURRENT_USER: 'quiz_current_user'
};

// Initialize Mock Data
function initializeMockData() {
    // Create sample quizzes if none exist
    if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
        const sampleQuizzes = [
            {
                code: '123456',
                title: 'JavaScript Basics',
                description: 'Test your knowledge of JavaScript fundamentals',
                timeLimit: 600,
                creatorEmail: 'demo@example.com',
                questions: [
                    {
                        text: 'What is the output of: typeof null?',
                        options: ['null', 'undefined', 'object', 'number'],
                        correctAnswer: 2
                    },
                    {
                        text: 'Which method is used to add elements to the end of an array?',
                        options: ['push()', 'pop()', 'shift()', 'unshift()'],
                        correctAnswer: 0
                    },
                    {
                        text: 'What does "=== " operator do?',
                        options: ['Assignment', 'Comparison without type check', 'Comparison with type check', 'None of the above'],
                        correctAnswer: 2
                    }
                ]
            },
            {
                code: '789012',
                title: 'Web Development Quiz',
                description: 'Test your HTML, CSS, and JavaScript knowledge',
                timeLimit: 900,
                creatorEmail: 'demo@example.com',
                questions: [
                    {
                        text: 'What does HTML stand for?',
                        options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
                        correctAnswer: 0
                    },
                    {
                        text: 'Which CSS property is used to change text color?',
                        options: ['text-color', 'font-color', 'color', 'text-style'],
                        correctAnswer: 2
                    },
                    {
                        text: 'What is the correct syntax for a JavaScript function?',
                        options: ['function myFunc()', 'def myFunc()', 'function: myFunc()', 'func myFunc()'],
                        correctAnswer: 0
                    },
                    {
                        text: 'Which HTML tag is used for creating a hyperlink?',
                        options: ['<link>', '<a>', '<href>', '<hyperlink>'],
                        correctAnswer: 1
                    }
                ]
            }
        ];
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(sampleQuizzes));
    }
    
    // Create sample users if none exist
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const sampleUsers = [
            {
                email: 'demo@example.com',
                password: 'demo123',
                name: 'Demo User'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sampleUsers));
    }
    
    // Initialize results storage if it doesn't exist
    if (!localStorage.getItem(STORAGE_KEYS.RESULTS)) {
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify({}));
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mock data
    initializeMockData();
    
    // Check for saved current user
    const currentUserData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentUserData) {
        state.currentUser = JSON.parse(currentUserData);
    }

    // Apply saved theme
    const theme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', theme === 'dark');
    
    // Setup anti-cheat listeners
    setupAntiCheat();
    
    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
        if (state.currentPage === 'quizPage') {
            e.preventDefault();
            showAlert('Right-click is disabled during quiz', 'warning');
        }
    });
});

// Navigation
function navigateTo(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = pageId;
        
        // Page-specific logic
        if (pageId === 'dashboardPage') {
            loadTests();
            loadProfile();
        }
    } else {
        document.getElementById('notFoundPage').classList.add('active');
    }
}

// Alert System
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠'
    };
    
    alert.innerHTML = `
        <span class="alert-icon">${icons[type] || '✓'}</span>
        <span class="alert-message">${escapeHtml(message)}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Join Flow
function submitJoinCode(event) {
    event.preventDefault();
    const code = document.getElementById('quizCode').value.trim();
    
    if (code.length !== 6) {
        showAlert('Please enter a valid 6-digit code', 'error');
        return;
    }
    
    state.quizCode = code;
    navigateTo('joinDetailsPage');
}

function submitJoinDetails(event) {
    event.preventDefault();
    
    const name = document.getElementById('studentName').value.trim();
    const roll = document.getElementById('rollNumber').value.trim();
    const branch = document.getElementById('branch').value.trim();
    
    // Save participant details
    state.participant = { name, roll, branch };
    
    // Fetch quiz from mock data
    fetchQuiz();
}

function fetchQuiz() {
    try {
        showAlert('Loading quiz...', 'success');
        
        // Get quizzes from local storage
        const quizzes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
        const quiz = quizzes.find(q => q.code === state.quizCode);
        
        if (!quiz) {
            throw new Error('Quiz not found. Try code: 123456 or 789012');
        }
        
        // Set current quiz data
        state.currentQuiz = {
            title: quiz.title,
            description: quiz.description,
            timeLimit: quiz.timeLimit
        };
        state.questions = quiz.questions;
        state.timeRemaining = quiz.timeLimit;
        
        // Start quiz
        startQuiz();
    } catch (error) {
        showAlert(error.message || 'Failed to load quiz', 'error');
        navigateTo('joinPage');
    }
}

function startQuiz() {
    navigateTo('quizPage');
    
    // Set quiz title
    document.getElementById('quizTitle').textContent = state.currentQuiz.title;
    
    // Add no-select class to prevent copying
    document.getElementById('quizPage').classList.add('no-select');
    
    // Start timer
    startTimer();
    
    // Load first question
    loadQuestion(0);
}

function loadQuestion(index) {
    if (index < 0 || index >= state.questions.length) return;
    
    state.currentQuestionIndex = index;
    const question = state.questions[index];
    
    // Update question counter
    document.getElementById('questionCounter').textContent = 
        `Question ${index + 1} of ${state.questions.length}`;
    
    // Display question
    document.getElementById('questionText').textContent = question.text;
    
    // Display options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        
        // Check if already answered
        if (state.answers[index] === i) {
            optionDiv.classList.add('selected');
        }
        
        optionDiv.onclick = () => selectOption(i);
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prevBtn').style.display = index > 0 ? 'block' : 'none';
    document.getElementById('nextBtn').style.display = 
        index < state.questions.length - 1 ? 'block' : 'none';
    document.getElementById('submitBtn').style.display = 
        index === state.questions.length - 1 ? 'block' : 'none';
}

function selectOption(optionIndex) {
    state.answers[state.currentQuestionIndex] = optionIndex;
    
    // Update UI
    document.querySelectorAll('.option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === optionIndex);
    });
}

function navigateQuestion(direction) {
    const newIndex = state.currentQuestionIndex + direction;
    loadQuestion(newIndex);
}

function startTimer() {
    const timerDisplay = document.getElementById('timeLeft');
    const timerElement = document.getElementById('timer');
    
    state.timer = setInterval(() => {
        state.timeRemaining--;
        
        const minutes = Math.floor(state.timeRemaining / 60);
        const seconds = state.timeRemaining % 60;
        timerDisplay.textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Warning when less than 1 minute
        if (state.timeRemaining <= 60) {
            timerElement.classList.add('warning');
        }
        
        // Auto submit when time's up
        if (state.timeRemaining <= 0) {
            clearInterval(state.timer);
            submitQuiz(true);
        }
    }, 1000);
}

async function submitQuiz(autoSubmit = false) {
    if (!autoSubmit) {
        const confirmed = confirm('Are you sure you want to submit your quiz?');
        if (!confirmed) return;
    }
    
    // Clear timer
    if (state.timer) {
        clearInterval(state.timer);
    }
    
    try {
        // Calculate score locally
        let score = 0;
        const answersArray = [];
        
        state.questions.forEach((question, index) => {
            const userAnswer = state.answers[index];
            if (userAnswer !== undefined) {
                answersArray.push({
                    questionIndex: index,
                    selectedOption: userAnswer
                });
                
                // Check if answer is correct
                if (userAnswer === question.correctAnswer) {
                    score++;
                }
            }
        });
        
        const totalQuestions = state.questions.length;
        
        // Save result to local storage
        const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '{}');
        if (!results[state.quizCode]) {
            results[state.quizCode] = [];
        }
        
        const resultEntry = {
            name: state.participant.name,
            roll: state.participant.roll,
            branch: state.participant.branch,
            score: score,
            total: totalQuestions,
            timestamp: new Date().toISOString(),
            answers: answersArray
        };
        
        results[state.quizCode].push(resultEntry);
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
        
        // Show results
        showResults(score, totalQuestions);
    } catch (error) {
        showAlert(error.message || 'Failed to submit quiz', 'error');
    }
}

function showResults(score, total) {
    navigateTo('resultsPage');
    
    const percentage = Math.round((score / total) * 100);
    
    document.getElementById('scorePercent').textContent = `${percentage}%`;
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('totalQuestions').textContent = total;
    
    // Reset quiz state
    state.answers = {};
    state.currentQuestionIndex = 0;
    state.tabSwitchCount = 0;
}

// Anti-Cheat System
function setupAntiCheat() {
    // Detect tab switching
    document.addEventListener('visibilitychange', () => {
        if (state.currentPage === 'quizPage' && document.hidden) {
            state.tabSwitchCount++;
            showAlert(`Tab switch detected! Count: ${state.tabSwitchCount}`, 'warning');
            
            // Auto-submit after 3 switches
            if (state.tabSwitchCount >= 3) {
                showAlert('Too many tab switches! Auto-submitting quiz.', 'error');
                setTimeout(() => submitQuiz(true), 2000);
            }
        }
    });
    
    // Disable copy-paste
    document.addEventListener('copy', (e) => {
        if (state.currentPage === 'quizPage') {
            e.preventDefault();
            showAlert('Copying is disabled during quiz', 'warning');
        }
    });
    
    document.addEventListener('paste', (e) => {
        if (state.currentPage === 'quizPage') {
            e.preventDefault();
            showAlert('Pasting is disabled during quiz', 'warning');
        }
    });
    
    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (state.currentPage === 'quizPage') {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                showAlert('Developer tools are disabled during quiz', 'warning');
            }
        }
    });
}

// Authentication
function switchAuthTab(type) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (type === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Get users from local storage
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid credentials. Try: demo@example.com / demo123');
        }
        
        // Save current user (without password)
        const userData = { email: user.email, name: user.name };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
        state.currentUser = userData;
        
        showAlert('Login successful!', 'success');
        navigateTo('dashboardPage');
    } catch (error) {
        showAlert(error.message || 'Login failed', 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        // Get users from local storage
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
            throw new Error('User already exists with this email');
        }
        
        // Add new user
        // Note: In a demo app, passwords are stored in plain text for simplicity.
        // In production, always hash passwords before storing.
        const newUser = { email, password, name };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        // Save current user (without password)
        const userData = { email, name };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
        state.currentUser = userData;
        
        showAlert('Registration successful!', 'success');
        navigateTo('dashboardPage');
    } catch (error) {
        showAlert(error.message || 'Registration failed', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    state.currentUser = null;
    showAlert('Logged out successfully', 'success');
    navigateTo('landingPage');
}

// Dashboard
function switchDashboardTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // Find the button that matches the tab name and make it active
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().replace(' ', '') === tabName.toLowerCase().replace('tab', '')) {
            btn.classList.add('active');
        }
    });
    
    // Update tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'myTests') {
        loadTests();
    } else if (tabName === 'profile') {
        loadProfile();
    }
}

// Create Test
function addQuestion() {
    state.questionCount++;
    const container = document.getElementById('questionsContainer');
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.id = `question-${state.questionCount}`;
    
    questionDiv.innerHTML = `
        <div class="question-item-header">
            <h4>Question ${state.questionCount}</h4>
            <button type="button" class="btn-delete" onclick="deleteQuestion(${state.questionCount})">Delete</button>
        </div>
        <div class="form-group">
            <label>Question Text</label>
            <input type="text" class="question-text" required placeholder="Enter question">
        </div>
        <div class="form-group">
            <label>Options</label>
            <div class="options-list" id="options-${state.questionCount}">
                <div class="option-item">
                    <input type="text" class="option-text" required placeholder="Option 1">
                    <button type="button" onclick="deleteOption(this)">×</button>
                </div>
                <div class="option-item">
                    <input type="text" class="option-text" required placeholder="Option 2">
                    <button type="button" onclick="deleteOption(this)">×</button>
                </div>
            </div>
            <button type="button" class="btn-add-option" onclick="addOption(${state.questionCount})">+ Add Option</button>
        </div>
        <div class="form-group">
            <label>Correct Answer (Option Number)</label>
            <input type="number" class="correct-answer" required placeholder="e.g., 1" min="1">
        </div>
    `;
    
    container.appendChild(questionDiv);
}

function deleteQuestion(questionId) {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
        element.remove();
    }
}

function addOption(questionId) {
    const container = document.getElementById(`options-${questionId}`);
    const optionCount = container.children.length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input type="text" class="option-text" required placeholder="Option ${optionCount}">
        <button type="button" onclick="deleteOption(this)">×</button>
    `;
    
    container.appendChild(optionDiv);
}

function deleteOption(button) {
    const optionItem = button.parentElement;
    const optionsList = optionItem.parentElement;
    
    if (optionsList.children.length > 2) {
        optionItem.remove();
    } else {
        showAlert('At least 2 options are required', 'warning');
    }
}

function handleCreateTest(event) {
    event.preventDefault();
    
    const title = document.getElementById('testTitle').value;
    const description = document.getElementById('testDescription').value;
    const timeLimit = parseInt(document.getElementById('testTime').value);
    
    // Collect questions
    const questions = [];
    document.querySelectorAll('.question-item').forEach(questionDiv => {
        const questionText = questionDiv.querySelector('.question-text').value;
        const options = Array.from(questionDiv.querySelectorAll('.option-text'))
            .map(input => input.value);
        const correctAnswer = parseInt(questionDiv.querySelector('.correct-answer').value) - 1;
        
        questions.push({
            text: questionText,
            options: options,
            correctAnswer: correctAnswer
        });
    });
    
    if (questions.length === 0) {
        showAlert('Please add at least one question', 'error');
        return;
    }
    
    try {
        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Get existing quizzes
        const quizzes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
        
        // Add new quiz
        const newQuiz = {
            code,
            title,
            description,
            timeLimit,
            creatorEmail: state.currentUser.email,
            questions
        };
        
        quizzes.push(newQuiz);
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
        
        showAlert(`Test created! Code: ${code}`, 'success');
        
        // Reset form
        document.getElementById('createTestForm').reset();
        document.getElementById('questionsContainer').innerHTML = '<h3>Questions</h3>';
        state.questionCount = 0;
        
        // Switch to My Tests tab
        switchDashboardTab('myTests');
    } catch (error) {
        showAlert(error.message || 'Failed to create test', 'error');
    }
}

// My Tests
function loadTests() {
    const container = document.getElementById('testsContainer');
    container.innerHTML = '<div class="skeleton-loader"><div class="skeleton-card"></div><div class="skeleton-card"></div></div>';
    
    try {
        // Get all quizzes from local storage
        const allQuizzes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
        
        // Filter quizzes created by current user
        const userQuizzes = allQuizzes.filter(q => q.creatorEmail === state.currentUser.email);
        state.testData = userQuizzes;
        
        if (userQuizzes.length === 0) {
            container.innerHTML = '<p>No tests created yet. Create your first test!</p>';
            return;
        }
        
        container.innerHTML = userQuizzes.map(test => `
            <div class="test-card">
                <div class="test-card-header">
                    <div class="test-card-title">
                        <h3>${escapeHtml(test.title)}</h3>
                        <p>${escapeHtml(test.description || 'No description')}</p>
                        <p><strong>Code:</strong> ${escapeHtml(test.code)}</p>
                        <p><strong>Questions:</strong> ${test.questions.length}</p>
                    </div>
                </div>
                <div class="test-card-actions">
                    <button class="btn btn-primary" onclick="viewResults('${escapeHtml(test.code)}')">Results</button>
                    <button class="btn btn-danger" onclick="deleteTest('${escapeHtml(test.code)}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p>Failed to load tests</p>';
        showAlert(error.message || 'Failed to load tests', 'error');
    }
}

function deleteTest(code) {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
        // Get all quizzes
        const quizzes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
        
        // Filter out the quiz to delete
        const updatedQuizzes = quizzes.filter(q => q.code !== code);
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updatedQuizzes));
        
        // Also remove results for this quiz
        const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '{}');
        delete results[code];
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
        
        showAlert('Test deleted successfully', 'success');
        loadTests();
    } catch (error) {
        showAlert(error.message || 'Failed to delete test', 'error');
    }
}

function viewResults(code) {
    navigateTo('testResultsPage');
    
    try {
        // Get results from local storage
        const allResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '{}');
        const quizResults = allResults[code] || [];
        
        // Sort by score (descending) for leaderboard
        const leaderboard = [...quizResults].sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // If scores are equal, sort by timestamp (earlier is better)
            return new Date(a.timestamp) - new Date(b.timestamp);
        }).map(result => ({
            name: result.name,
            score: result.score,
            total: result.total,
            time: new Date(result.timestamp).toLocaleTimeString()
        }));
        
        // Prepare participants list
        const participants = quizResults.map(result => ({
            name: result.name,
            roll: result.roll,
            branch: result.branch,
            score: result.score,
            total: result.total
        }));
        
        displayLeaderboard(leaderboard);
        displayParticipants(participants);
    } catch (error) {
        showAlert(error.message || 'Failed to load results', 'error');
    }
}

function displayLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboardContent');
    
    if (!leaderboard || leaderboard.length === 0) {
        container.innerHTML = '<p>No participants yet</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="leaderboard-table">
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Score</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map((entry, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${escapeHtml(entry.name)}</td>
                            <td>${entry.score}/${entry.total}</td>
                            <td>${escapeHtml(entry.time || 'N/A')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function displayParticipants(participants) {
    const container = document.getElementById('participantsContent');
    
    if (!participants || participants.length === 0) {
        container.innerHTML = '<p>No participants yet</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="participants-table">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Roll Number</th>
                        <th>Branch</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants.map(p => `
                        <tr>
                            <td>${escapeHtml(p.name)}</td>
                            <td>${escapeHtml(p.roll)}</td>
                            <td>${escapeHtml(p.branch)}</td>
                            <td>${p.score}/${p.total}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function switchResultsTab(tab) {
    document.querySelectorAll('.results-tabs .tab').forEach(t => {
        t.classList.remove('active');
    });
    document.querySelectorAll('.results-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Find the button that matches the tab name and make it active
    const buttons = document.querySelectorAll('.results-tabs .tab');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase() === tab.toLowerCase()) {
            btn.classList.add('active');
        }
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
}

// Profile
function loadProfile() {
    if (!state.currentUser) return;
    
    document.getElementById('profileName').textContent = state.currentUser.name || 'User Name';
    document.getElementById('profileEmail').textContent = state.currentUser.email || 'user@example.com';
    
    // Set avatar initials
    const initials = (state.currentUser.name || 'MA')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    document.getElementById('avatarInitials').textContent = initials;
    
    // Set theme select
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.getElementById('themeSelect').value = currentTheme;
}

function changeTheme(theme) {
    localStorage.setItem('theme', theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
    showAlert(`Theme changed to ${theme}`, 'success');
}

// Initialize first question form on load
if (document.getElementById('createTestTab')) {
    // Don't auto-add question, let user add manually
}
