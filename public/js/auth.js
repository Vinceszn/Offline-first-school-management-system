// auth.js — Authentication handling for School OS frontend
// Author: Vincent Onwuli
// Purpose: Handle user login, logout, and authentication state management
// Version: 1.0.0

/**
 * Initialize authentication functionality
 * Purpose: Set up login form and authentication event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthenticationHandlers();
});

/**
 * Set up authentication event handlers
 * Purpose: Bind events for login form and authentication actions
 */
function initializeAuthenticationHandlers() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Clear error message when user starts typing
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput && passwordInput) {
        usernameInput.addEventListener('input', clearLoginError);
        passwordInput.addEventListener('input', clearLoginError);
    }
    
    // Handle Enter key in login form
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !elements.loginScreen.classList.contains('hidden')) {
            e.preventDefault();
            handleLogin(e);
        }
    });
}

/**
 * Handle login form submission
 * Purpose: Authenticate user credentials and establish session
 * @param {Event} e - Form submission event
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target.tagName === 'FORM' ? e.target : document.getElementById('login-form');
    const submitButton = form.querySelector('button[type="submit"]');
    const errorDiv = document.getElementById('login-error');
    
    // Get form data
    const formData = new FormData(form);
    const credentials = {
        username: formData.get('username').trim(),
        password: formData.get('password')
    };
    
    // Validate input
    if (!credentials.username || !credentials.password) {
        showLoginError('Please enter both username and password');
        return;
    }
    
    // Show loading state
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    clearLoginError();
    
    try {
        // Make login request
        const response = await fetch(`${App.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Login successful
            const { user, token } = data.data;
            
            // Store authentication data
            localStorage.setItem('school_os_token', token);
            App.currentUser = user;
            App.isAuthenticated = true;
            
            // Clear form
            form.reset();
            
            // Show main application
            showMainApplication();
            
            // Show success message
            showToast(`Welcome back, ${user.full_name || user.username}!`, 'success');
            
            console.log('Login successful:', user);
        } else {
            // Login failed
            const errorMessage = data.error || 'Login failed. Please try again.';
            showLoginError(errorMessage);
            
            // Focus username field for retry
            document.getElementById('username').focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Connection error. Please check your internet connection and try again.');
    } finally {
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

/**
 * Show login error message
 * Purpose: Display error message in login form
 * @param {string} message - Error message to display
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            clearLoginError();
        }, 5000);
    }
}

/**
 * Clear login error message
 * Purpose: Hide error message in login form
 */
function clearLoginError() {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
    }
}

/**
 * Handle user logout
 * Purpose: Clear authentication and return to login screen
 */
async function logout() {
    try {
        // Show loading state
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.textContent = '🔄 Logging out...';
            logoutBtn.disabled = true;
        }
        
        // Call logout API
        const token = localStorage.getItem('school_os_token');
        if (token) {
            await fetch(`${App.apiBaseUrl}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // Clear authentication data
        localStorage.removeItem('school_os_token');
        App.currentUser = null;
        App.isAuthenticated = false;
        
        // Show login screen
        showLoginScreen();
        
        // Show success message
        showToast('Logged out successfully', 'success');
        
        console.log('Logout successful');
    } catch (error) {
        console.error('Logout error:', error);
        
        // Force logout even if API call fails
        localStorage.removeItem('school_os_token');
        App.currentUser = null;
        App.isAuthenticated = false;
        showLoginScreen();
        
        showToast('Logged out (connection error)', 'warning');
    }
}

/**
 * Check if user is authenticated
 * Purpose: Verify current authentication status
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated() {
    return App.isAuthenticated && App.currentUser && localStorage.getItem('school_os_token');
}

/**
 * Get current user information
 * Purpose: Return current authenticated user data
 * @returns {Object|null} Current user object or null
 */
function getCurrentUser() {
    return App.currentUser;
}

/**
 * Get authentication token
 * Purpose: Return current authentication token
 * @returns {string|null} Authentication token or null
 */
function getAuthToken() {
    return localStorage.getItem('school_os_token');
}

/**
 * Refresh authentication token
 * Purpose: Verify and refresh authentication token if needed
 * @returns {Promise<boolean>} True if token is valid/refreshed
 */
async function refreshAuthToken() {
    const token = getAuthToken();
    
    if (!token) {
        return false;
    }
    
    try {
        const response = await fetch(`${App.apiBaseUrl}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            App.currentUser = data.data;
            App.isAuthenticated = true;
            return true;
        } else {
            // Token is invalid
            localStorage.removeItem('school_os_token');
            App.currentUser = null;
            App.isAuthenticated = false;
            return false;
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

/**
 * Handle authentication errors
 * Purpose: Process authentication-related errors and redirect if needed
 * @param {Error} error - Authentication error
 */
function handleAuthError(error) {
    console.error('Authentication error:', error);
    
    if (error.message.includes('401') || error.message.includes('Authentication required')) {
        // Clear invalid authentication
        localStorage.removeItem('school_os_token');
        App.currentUser = null;
        App.isAuthenticated = false;
        
        // Show login screen
        showLoginScreen();
        
        showToast('Session expired. Please login again.', 'warning');
    }
}

/**
 * Auto-refresh token periodically
 * Purpose: Keep authentication token fresh
 */
function startTokenRefreshTimer() {
    // Refresh token every 30 minutes
    setInterval(async () => {
        if (isAuthenticated()) {
            const isValid = await refreshAuthToken();
            if (!isValid) {
                handleAuthError(new Error('Token refresh failed'));
            }
        }
    }, 30 * 60 * 1000); // 30 minutes
}

/**
 * Initialize default admin user (development only)
 * Purpose: Create default admin account if none exists
 */
async function initializeDefaultUser() {
    try {
        // This would typically be done on the server side
        // Only for development/demo purposes
        console.log('Default user initialization handled by server');
    } catch (error) {
        console.error('Failed to initialize default user:', error);
    }
}

/**
 * Show password strength indicator
 * Purpose: Provide visual feedback for password strength
 * @param {string} password - Password to evaluate
 * @returns {Object} Strength score and feedback
 */
function evaluatePasswordStrength(password) {
    let score = 0;
    const feedback = [];
    
    if (password.length >= 8) {
        score += 1;
    } else {
        feedback.push('Use at least 8 characters');
    }
    
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score < 2) feedback.push('Add uppercase, lowercase, numbers, and symbols');
    
    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score] || 'Very Weak';
    
    return {
        score,
        strength,
        feedback: feedback.join('. ')
    };
}

/**
 * Handle "Remember Me" functionality
 * Purpose: Manage persistent login sessions
 * @param {boolean} remember - Whether to remember the user
 */
function setRememberMe(remember) {
    if (remember) {
        // Store in localStorage (already doing this)
        localStorage.setItem('school_os_remember', 'true');
    } else {
        // Use sessionStorage instead
        const token = localStorage.getItem('school_os_token');
        if (token) {
            sessionStorage.setItem('school_os_token', token);
            localStorage.removeItem('school_os_token');
        }
        localStorage.removeItem('school_os_remember');
    }
}

// Start token refresh timer when authentication module loads
if (typeof App !== 'undefined') {
    startTokenRefreshTimer();
}

// Export authentication functions
window.auth = {
    handleLogin,
    logout,
    isAuthenticated,
    getCurrentUser,
    getAuthToken,
    refreshAuthToken,
    handleAuthError,
    evaluatePasswordStrength,
    setRememberMe
};
