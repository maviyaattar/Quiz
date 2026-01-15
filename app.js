// Import mock backend functions for development/testing
import * as mockBackend from './mockBackend.js';

/**
 * QUIZ APPLICATION - BACKEND INTEGRATION GUIDE
 * 
 * This application supports both MOCK and REAL backend integration:
 * 
 * MOCK BACKEND (for development/testing):
 * - Set USE_MOCK_BACKEND = true below
 * - Uses mockBackend.js for all API calls
 * - No server required, works entirely in browser
 * - Sample data includes demo user (email: demo@example.com, password: demo123)
 * - Sample quiz available with code: 123456
 * 
 * REAL BACKEND (for production):
 * - Set USE_MOCK_BACKEND = false below
 * - Update API_BASE_URL to your backend server
 * - Requires running backend server with proper endpoints
 * - All fetch() calls go to your actual backend API
 * 
 * TO SWITCH BETWEEN MOCK AND REAL BACKEND:
 * Simply toggle the USE_MOCK_BACKEND constant below!
 */

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

// API Configuration
// Set USE_MOCK_BACKEND to true to use mock data for development/testing
// Set to false to use the real backend API
const USE_MOCK_BACKEND = false;

// Update this URL to match your backend deployment
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://quiz-backend-production-4aaf.up.railway.app';

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
        
        let joinData, questionsData;
        
        // Use mock backend or real API based on configuration
        if (USE_MOCK_BACKEND) {
            joinData = await mockBackend.mockJoinQuiz(state.quizCode, state.participant);
            questionsData = await mockBackend.mockGetQuestions(state.quizCode);
        } else {
            // API call to join quiz
            const joinResponse = await fetch(`${API_BASE_URL}/api/quiz/join/${state.quizCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(state.participant)
            });
            
            if (!joinResponse.ok) {
                throw new Error('Quiz not found or not active');
            }
            
            joinData = await joinResponse.json();
            
            // Fetch questions separately
            const questionsResponse = await fetch(`${API_BASE_URL}/api/quiz/questions/${state.quizCode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!questionsResponse.ok) {
                throw new Error('Failed to load questions');
            }
            
            questionsData = await questionsResponse.json();
        }
        
        // Validate quiz data
        if (!joinData?.currentQuiz) {
            throw new Error('Invalid quiz data received');
        }
        
        state.currentQuiz = joinData.currentQuiz;
        
        // Validate questions data
        if (!questionsData?.questions || !Array.isArray(questionsData.questions)) {
            throw new Error('Invalid questions data received');
        }
        
        state.questions = questionsData.questions;
        
        // Set timer from server endTime
        if (state.currentQuiz?.endTime) {
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
    // Validate that quiz data exists
    if (!state.currentQuiz) {
        showAlert('Quiz data not loaded properly', 'error');
        navigateTo('joinPage');
        return;
    }
    
    navigateTo('quizPage');
    
    // Set quiz title with fallback
    document.getElementById('quizTitle').textContent = state.currentQuiz?.title || 'Quiz';
    
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
    
    // Validate question data
    if (!question) {
        showAlert('Question data not available', 'error');
        return;
    }
    
    // Update question counter
    document.getElementById('questionCounter').textContent = 
        `Question ${index + 1} of ${state.questions.length}`;
    
    // Display question with fallback
    document.getElementById('questionText').textContent = question.text || 'Question unavailable';
    
    // Display options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    // Ensure options exist
    const options = question.options || [];
    options.forEach((option, i) => {
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
        // Convert answers object to array format
        const answersArray = Object.entries(state.answers).map(([questionIndex, optionIndex]) => {
            const parsedIndex = parseInt(questionIndex, 10);
            if (isNaN(parsedIndex)) {
                throw new Error(`Invalid question index: ${questionIndex}`);
            }
            return {
                questionIndex: parsedIndex,
                selectedOption: optionIndex
            };
        });
        
        const submissionData = {
            name: state.participant.name,
            branch: state.participant.branch,
            rollNo: state.participant.roll,
            answers: answersArray
        };
        
        let result;
        
        // Use mock backend or real API based on configuration
        if (USE_MOCK_BACKEND) {
            result = await mockBackend.mockSubmitQuiz(state.quizCode, submissionData);
        } else {
            // Submit to backend with correct payload structure
            const response = await fetch(`${API_BASE_URL}/api/quiz/submit/${state.quizCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submissionData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit quiz');
            }
            
            result = await response.json();
        }
        
        // Validate result data with safe access
        const score = result?.score ?? 0;
        const totalQuestions = result?.totalQuestions ?? state.questions.length;
        
        // Show results with server-calculated score
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
        let data;
        
        // Use mock backend or real API based on configuration
        if (USE_MOCK_BACKEND) {
            data = await mockBackend.mockLogin(email, password);
        } else {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            
            data = await response.json();
        }
        
        // Validate response data
        if (!data?.token || !data?.user) {
            throw new Error('Invalid response from server');
        }
        
        // Save auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        state.currentUser = data.user;
        
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
        let data;
        
        // Use mock backend or real API based on configuration
        if (USE_MOCK_BACKEND) {
            data = await mockBackend.mockRegister(name, email, password);
        } else {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            if (!response.ok) {
                throw new Error('Registration failed');
            }
            
            data = await response.json();
        }
        
        // Validate response data
        if (!data?.token || !data?.user) {
            throw new Error('Invalid response from server');
        }
        
        // Save auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        state.currentUser = data.user;
        
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
        let data;
        
        // Use mock backend or real API based on configuration
        if (USE_MOCK_BACKEND) {
            data = await mockBackend.mockCreateQuiz({
                title,
                description,
                timeLimit,
                questions
            }, localStorage.getItem('token'));
        } else {
            const response = await fetch(`${API_BASE_URL}/api/quiz/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    timeLimit,
                    questions
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create test');
            }
            
            data = await response.json();
        }
        
        // Validate response data
        if (!data?.code) {
            throw new Error('Invalid response: missing quiz code');
        }
        
        // Save to localStorage for tracking
        const savedTests = JSON.parse(localStorage.getItem('myQuizzes') || '[]');
        savedTests.push({
            code: data.code,
            title,
            description,
            timeLimit
        });
        localStorage.setItem('myQuizzes', JSON.stringify(savedTests));
        
        showAlert(`Test created! Code: ${data.code}`, 'success');
        
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
                        <h3>${test?.title || 'Untitled Quiz'}</h3>
                        <p>${test?.description || 'No description'}</p>
                        <p><strong>Code:</strong> ${test?.code || 'N/A'}</p>
                    </div>
                </div>
                <div class="test-card-actions">
                    <button class="btn btn-primary" onclick="viewResults('${test?.code || ''}')">Results</button>
                    <button class="btn btn-danger" onclick="deleteTest('${test?.code || ''}')">Delete</button>
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
        // Use mock backend or real API based on configuration
        if (USE_MOCK_BACKEND) {
            await mockBackend.mockDeleteQuiz(code, localStorage.getItem('token'));
        } else {
            const response = await fetch(`${API_BASE_URL}/api/quiz/delete/${code}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete test');
            }
        }
        
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
        let leaderboardData, summaryData;
        
        // Use mock backend or real API based on configuration
        if (USE_MOCK_BACKEND) {
            leaderboardData = await mockBackend.mockGetLeaderboard(code, localStorage.getItem('token'));
            summaryData = await mockBackend.mockGetSummary(code, localStorage.getItem('token'));
        } else {
            // Fetch leaderboard from correct endpoint
            const leaderboardResponse = await fetch(`${API_BASE_URL}/api/quiz/leaderboard/${code}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!leaderboardResponse.ok) {
                throw new Error('Failed to load leaderboard');
            }
            
            leaderboardData = await leaderboardResponse.json();
            
            // Fetch summary from correct endpoint
            const summaryResponse = await fetch(`${API_BASE_URL}/api/quiz/summary/${code}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!summaryResponse.ok) {
                throw new Error('Failed to load summary');
            }
            
            summaryData = await summaryResponse.json();
        }
        
        // Safe access to response data
        displayLeaderboard(leaderboardData?.leaderboard || []);
        displayParticipants(summaryData?.participants || []);
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
                            <td>${entry?.name || 'Unknown'}</td>
                            <td>${entry?.score || 0}/${entry?.total || 0}</td>
                            <td>${entry?.time || 'N/A'}</td>
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
                            <td>${p?.name || 'Unknown'}</td>
                            <td>${p?.roll || 'N/A'}</td>
                            <td>${p?.branch || 'N/A'}</td>
                            <td>${p?.score || 0}/${p?.total || 0}</td>
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
    
    // Safe access to user properties with fallbacks
    document.getElementById('profileName').textContent = state.currentUser?.name || 'User Name';
    document.getElementById('profileEmail').textContent = state.currentUser?.email || 'user@example.com';
    
    // Set avatar initials with safe access
    const userName = state.currentUser?.name || 'MA';
    const initials = userName
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

// Export functions to global scope for onclick handlers in HTML
// This is necessary because app.js is now an ES6 module
window.navigateTo = navigateTo;
window.submitJoinCode = submitJoinCode;
window.submitJoinDetails = submitJoinDetails;
window.navigateQuestion = navigateQuestion;
window.submitQuiz = submitQuiz;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.switchDashboardTab = switchDashboardTab;
window.addQuestion = addQuestion;
window.deleteQuestion = deleteQuestion;
window.addOption = addOption;
window.deleteOption = deleteOption;
window.handleCreateTest = handleCreateTest;
window.deleteTest = deleteTest;
window.viewResults = viewResults;
window.switchResultsTab = switchResultsTab;
window.loadProfile = loadProfile;
window.changeTheme = changeTheme;

