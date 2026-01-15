/**
 * MOCK BACKEND MODULE
 * 
 * This file contains mock data and stub backend logic for the Quiz application.
 * It simulates API responses for development and testing purposes.
 * 
 * HOW TO SWAP TO REAL BACKEND:
 * 1. In app.js, set USE_MOCK_BACKEND = false
 * 2. Ensure API_BASE_URL points to your actual backend server
 * 3. The app will switch to making real fetch() calls to the backend
 * 
 * This mock backend provides:
 * - User authentication (login/register)
 * - Quiz creation and management
 * - Quiz joining and submission
 * - Leaderboard and results
 */

// Mock Data Storage (simulates database)
const mockStorage = {
    users: [
        {
            id: 1,
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'demo123' // In real app, this would be hashed
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
            endTime: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
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

/**
 * Generate a random 6-digit quiz code
 */
function generateQuizCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a mock JWT token
 */
function generateToken(userId) {
    return `mock_token_${userId}_${Date.now()}`;
}

/**
 * Mock API: User Login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response
 */
export async function mockLogin(email, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = mockStorage.users.find(u => u.email === email);
    
    if (!user || user.password !== password) {
        throw new Error('Invalid credentials');
    }
    
    return {
        token: generateToken(user.id),
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };
}

/**
 * Mock API: User Registration
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Registration response
 */
export async function mockRegister(name, email, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if user already exists
    if (mockStorage.users.find(u => u.email === email)) {
        throw new Error('User already exists');
    }
    
    const newUser = {
        id: mockStorage.users.length + 1,
        name,
        email,
        password // In real app, this would be hashed
    };
    
    mockStorage.users.push(newUser);
    
    return {
        token: generateToken(newUser.id),
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }
    };
}

/**
 * Mock API: Create Quiz
 * @param {Object} quizData - Quiz data (title, description, timeLimit, questions)
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Created quiz with code
 */
export async function mockCreateQuiz(quizData, token) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!token) {
        throw new Error('Unauthorized');
    }
    
    const code = generateQuizCode();
    const newQuiz = {
        id: code,
        code,
        title: quizData.title,
        description: quizData.description,
        timeLimit: quizData.timeLimit,
        creatorId: 1, // Mock creator
        isActive: true,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + quizData.timeLimit * 1000).toISOString(),
        questions: quizData.questions
    };
    
    mockStorage.quizzes.push(newQuiz);
    
    return {
        code,
        quiz: newQuiz
    };
}

/**
 * Mock API: Join Quiz
 * @param {string} code - Quiz code
 * @param {Object} participant - Participant details (name, roll, branch)
 * @returns {Promise<Object>} Quiz data
 */
export async function mockJoinQuiz(code, participant) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const quiz = mockStorage.quizzes.find(q => q.code === code);
    
    if (!quiz) {
        throw new Error('Quiz not found or not active');
    }
    
    if (!quiz.isActive) {
        throw new Error('Quiz is not active');
    }
    
    // Add participant
    mockStorage.participants.push({
        quizCode: code,
        name: participant.name,
        roll: participant.roll,
        branch: participant.branch,
        joinedAt: new Date().toISOString()
    });
    
    return {
        currentQuiz: {
            id: quiz.id,
            code: quiz.code,
            title: quiz.title,
            description: quiz.description,
            timeLimit: quiz.timeLimit,
            isActive: quiz.isActive,
            startTime: quiz.startTime,
            endTime: quiz.endTime
        }
    };
}

/**
 * Mock API: Get Quiz Questions
 * @param {string} code - Quiz code
 * @returns {Promise<Object>} Quiz questions
 */
export async function mockGetQuestions(code) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quiz = mockStorage.quizzes.find(q => q.code === code);
    
    if (!quiz) {
        throw new Error('Quiz not found');
    }
    
    // Return questions without correct answers
    return {
        questions: quiz.questions.map(q => ({
            text: q.text,
            options: q.options
        }))
    };
}

/**
 * Mock API: Submit Quiz
 * @param {string} code - Quiz code
 * @param {Object} submission - Submission data (name, branch, rollNo, answers)
 * @returns {Promise<Object>} Result with score
 */
export async function mockSubmitQuiz(code, submission) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const quiz = mockStorage.quizzes.find(q => q.code === code);
    
    if (!quiz) {
        throw new Error('Quiz not found');
    }
    
    // Calculate score
    let score = 0;
    submission.answers.forEach(answer => {
        const question = quiz.questions[answer.questionIndex];
        if (question && question.correctAnswer === answer.selectedOption) {
            score++;
        }
    });
    
    // Store submission
    const submissionRecord = {
        quizCode: code,
        name: submission.name,
        roll: submission.rollNo,
        branch: submission.branch,
        score,
        totalQuestions: quiz.questions.length,
        submittedAt: new Date().toISOString(),
        answers: submission.answers
    };
    
    mockStorage.submissions.push(submissionRecord);
    
    return {
        score,
        totalQuestions: quiz.questions.length,
        percentage: Math.round((score / quiz.questions.length) * 100)
    };
}

/**
 * Mock API: Delete Quiz
 * @param {string} code - Quiz code
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Success response
 */
export async function mockDeleteQuiz(code, token) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!token) {
        throw new Error('Unauthorized');
    }
    
    const index = mockStorage.quizzes.findIndex(q => q.code === code);
    
    if (index === -1) {
        throw new Error('Quiz not found');
    }
    
    mockStorage.quizzes.splice(index, 1);
    
    // Remove related submissions and participants
    mockStorage.submissions = mockStorage.submissions.filter(s => s.quizCode !== code);
    mockStorage.participants = mockStorage.participants.filter(p => p.quizCode !== code);
    
    return { success: true };
}

/**
 * Mock API: Get Leaderboard
 * @param {string} code - Quiz code
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Leaderboard data
 */
export async function mockGetLeaderboard(code, token) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!token) {
        throw new Error('Unauthorized');
    }
    
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
    
    return { leaderboard };
}

/**
 * Mock API: Get Quiz Summary
 * @param {string} code - Quiz code
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Summary data with participants
 */
export async function mockGetSummary(code, token) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!token) {
        throw new Error('Unauthorized');
    }
    
    const quiz = mockStorage.quizzes.find(q => q.code === code);
    
    if (!quiz) {
        throw new Error('Quiz not found');
    }
    
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
    
    return { participants };
}

/**
 * Get sample quiz data for display purposes
 */
export function getSampleQuiz() {
    return {
        code: '123456',
        title: 'Sample Quiz',
        description: 'Try this sample quiz to see how it works',
        timeLimit: 600,
        isActive: true
    };
}

// Export mock storage for testing (optional)
export const __mockStorage = mockStorage;
