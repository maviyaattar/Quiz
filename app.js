/**
 * QUIZ APPLICATION - FRONTEND ONLY
 * 
 * This is a frontend-only quiz application that uses local mock data.
 * All data is stored in memory and browser localStorage.
 * 
 * Features:
 * - Demo user: email: demo@example.com, password: demo123
 * - Sample quiz available with code: 123456
 * - Create and manage quizzes (stored in browser memory during session)
 * - All functionality works without a backend server
 */

// Mock Data Storage (simulates database in memory)
const mockStorage = {
    users: [
        {
            id: 1,
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'demo123' // WARNING: Plain text password for demo only! Real apps should use bcrypt or similar hashing
        }
    ],
    quizzes: [
        {
            id: '123456',
            code: '123456',
            title: 'Sample Quiz',
            description: 'A sample quiz for testing',
            timeLimit: 600,
            creatorId: 1,
            isActive: true,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 600000).toISOString(),
            questions: [
                {
                    text: 'What is 2 + 2?',
                    options: ['3', '4', '5', '6'],
                    correctAnswer: 1
                },
                {
                    text: 'What is the capital of France?',
                    options: ['London', 'Berlin', 'Paris', 'Madrid'],
                    correctAnswer: 2
                },
                {
                    text: 'Which planet is closest to the Sun?',
                    options: ['Venus', 'Mercury', 'Earth', 'Mars'],
                    correctAnswer: 1
                }
            ]
        }
    ],
    submissions: [],
    participants: []
};

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

// Helper Functions
function generateQuizCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(userId) {
    return `mock_token_${userId}_${Date.now()}`;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved auth token
    const token = localStorage.getItem('token');
    if (token) {
        state.currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
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
        <span class="alert-message">${message}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
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
    
    // Fetch quiz and start
    fetchQuiz();
}

async function fetchQuiz() {
    try {
        showAlert('Loading quiz...', 'success');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Find quiz in mock storage
        const quiz = mockStorage.quizzes.find(q => q.code === state.quizCode);
        
        if (!quiz || !quiz.isActive) {
            throw new Error('Quiz not found or not active');
        }
        
        // Add participant to mock storage
        mockStorage.participants.push({
            quizCode: state.quizCode,
            name: state.participant.name,
            roll: state.participant.roll,
            branch: state.participant.branch,
            joinedAt: new Date().toISOString()
        });
        
        // Set current quiz data
        state.currentQuiz = {
            id: quiz.id,
            code: quiz.code,
            title: quiz.title,
            description: quiz.description,
            timeLimit: quiz.timeLimit,
            isActive: quiz.isActive,
            startTime: quiz.startTime,
            endTime: quiz.endTime
        };
        
        // Set questions (without correct answers)
        state.questions = quiz.questions.map(q => ({
            text: q.text,
            options: q.options
        }));
        
        // Set timer from endTime
        if (state.currentQuiz.endTime) {
            const endTime = new Date(state.currentQuiz.endTime).getTime();
            const now = Date.now();
            state.timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
        } else {
            state.timeRemaining = DEFAULT_QUIZ_TIME_SECONDS;
        }
        
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
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the quiz with correct answers
        const quiz = mockStorage.quizzes.find(q => q.code === state.quizCode);
        
        if (!quiz) {
            throw new Error('Quiz not found');
        }
        
        // Calculate score
        let score = 0;
        Object.entries(state.answers).forEach(([questionIndex, selectedOption]) => {
            const qIndex = parseInt(questionIndex, 10);
            const question = quiz.questions[qIndex];
            if (question && question.correctAnswer === selectedOption) {
                score++;
            }
        });
        
        const totalQuestions = quiz.questions.length;
        
        // Store submission
        mockStorage.submissions.push({
            quizCode: state.quizCode,
            name: state.participant.name,
            roll: state.participant.roll,
            branch: state.participant.branch,
            score,
            totalQuestions,
            submittedAt: new Date().toISOString(),
            answers: Object.entries(state.answers).map(([questionIndex, optionIndex]) => ({
                questionIndex: parseInt(questionIndex, 10),
                selectedOption: optionIndex
            }))
        });
        
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

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Find user in mock storage
        const user = mockStorage.users.find(u => u.email === email);
        
        // WARNING: Plain text password comparison for demo only! 
        // Real apps should use bcrypt.compare() or similar secure hashing
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials');
        }
        
        const token = generateToken(user.id);
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        // Save auth data
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        state.currentUser = userData;
        
        showAlert('Login successful!', 'success');
        navigateTo('dashboardPage');
    } catch (error) {
        showAlert(error.message || 'Login failed', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if user already exists
        if (mockStorage.users.find(u => u.email === email)) {
            throw new Error('User already exists');
        }
        
        // Create new user
        // WARNING: Storing plain text password for demo only!
        // Real apps should hash password with bcrypt before storing
        const newUser = {
            id: mockStorage.users.length + 1,
            name,
            email,
            password
        };
        
        mockStorage.users.push(newUser);
        
        const token = generateToken(newUser.id);
        const userData = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };
        
        // Save auth data
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        state.currentUser = userData;
        
        showAlert('Registration successful!', 'success');
        navigateTo('dashboardPage');
    } catch (error) {
        showAlert(error.message || 'Registration failed', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
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

async function handleCreateTest(event) {
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
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const code = generateQuizCode();
        const validTimeLimit = typeof timeLimit === 'number' && timeLimit > 0 ? timeLimit : 600;
        
        // Create new quiz in mock storage
        const newQuiz = {
            id: code,
            code,
            title,
            description,
            timeLimit: validTimeLimit,
            creatorId: state.currentUser?.id || 1,
            isActive: true,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + validTimeLimit * 1000).toISOString(),
            questions
        };
        
        mockStorage.quizzes.push(newQuiz);
        
        // Save to localStorage for tracking
        const savedTests = JSON.parse(localStorage.getItem('myQuizzes') || '[]');
        savedTests.push({
            code,
            title,
            description,
            timeLimit: validTimeLimit
        });
        localStorage.setItem('myQuizzes', JSON.stringify(savedTests));
        
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
async function loadTests() {
    const container = document.getElementById('testsContainer');
    container.innerHTML = '<div class="skeleton-loader"><div class="skeleton-card"></div><div class="skeleton-card"></div></div>';
    
    try {
        // Use localStorage for quiz tracking since backend doesn't provide a "my-tests" list endpoint.
        // Real endpoints (leaderboard, summary) are used when viewing individual quiz results.
        const savedTests = JSON.parse(localStorage.getItem('myQuizzes') || '[]');
        state.testData = savedTests;
        
        if (savedTests.length === 0) {
            container.innerHTML = '<p>No tests created yet. Create your first test!</p>';
            return;
        }
        
        container.innerHTML = savedTests.map(test => `
            <div class="test-card">
                <div class="test-card-header">
                    <div class="test-card-title">
                        <h3>${test.title}</h3>
                        <p>${test.description || 'No description'}</p>
                        <p><strong>Code:</strong> ${test.code}</p>
                    </div>
                </div>
                <div class="test-card-actions">
                    <button class="btn btn-primary" onclick="viewResults('${test.code}')">Results</button>
                    <button class="btn btn-danger" onclick="deleteTest('${test.code}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p>Failed to load tests</p>';
        showAlert(error.message || 'Failed to load tests', 'error');
    }
}

async function deleteTest(code) {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Remove from mock storage
        const index = mockStorage.quizzes.findIndex(q => q.code === code);
        if (index !== -1) {
            mockStorage.quizzes.splice(index, 1);
        }
        
        // Remove related submissions and participants
        mockStorage.submissions = mockStorage.submissions.filter(s => s.quizCode !== code);
        mockStorage.participants = mockStorage.participants.filter(p => p.quizCode !== code);
        
        // Remove from localStorage
        const savedTests = JSON.parse(localStorage.getItem('myQuizzes') || '[]');
        const updatedTests = savedTests.filter(test => test.code !== code);
        localStorage.setItem('myQuizzes', JSON.stringify(updatedTests));
        
        showAlert('Test deleted successfully', 'success');
        loadTests();
    } catch (error) {
        showAlert(error.message || 'Failed to delete test', 'error');
    }
}

async function viewResults(code) {
    navigateTo('testResultsPage');
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Find quiz in mock storage
        const quiz = mockStorage.quizzes.find(q => q.code === code);
        
        if (!quiz) {
            throw new Error('Quiz not found');
        }
        
        // Get submissions for this quiz and sort by score
        const submissions = mockStorage.submissions
            .filter(s => s.quizCode === code)
            .sort((a, b) => b.score - a.score);
        
        const leaderboard = submissions.map(s => ({
            name: s.name,
            score: s.score,
            total: s.totalQuestions,
            time: s.submittedAt
        }));
        
        // Get all participants and their submissions
        const participants = mockStorage.participants
            .filter(p => p.quizCode === code)
            .map(p => {
                const submission = mockStorage.submissions.find(
                    s => s.quizCode === code && s.name === p.name && s.roll === p.roll
                );
                
                return {
                    name: p.name,
                    roll: p.roll,
                    branch: p.branch,
                    score: submission ? submission.score : 0,
                    total: quiz.questions.length
                };
            });
        
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
                            <td>${entry.name}</td>
                            <td>${entry.score}/${entry.total}</td>
                            <td>${entry.time || 'N/A'}</td>
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
                            <td>${p.name}</td>
                            <td>${p.roll}</td>
                            <td>${p.branch}</td>
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
