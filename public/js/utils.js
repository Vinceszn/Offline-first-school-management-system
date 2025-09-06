// utils.js — Utility functions for School OS frontend
// Author: Vincent Onwuli
// Purpose: Common utility functions used throughout the application
// Version: 1.0.0

/**
 * Make API request with authentication
 * Purpose: Centralized API request handling with error management
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} API response data
 */
async function apiRequest(endpoint, method = 'GET', data = null, options = {}) {
    const token = localStorage.getItem('school_os_token');
    
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    // Add authorization header if token exists
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add request body for POST/PUT requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${App.apiBaseUrl}${endpoint}`, config);
        
        // Handle authentication errors
        if (response.status === 401) {
            localStorage.removeItem('school_os_token');
            App.isAuthenticated = false;
            showLoginScreen();
            throw new Error('Authentication required');
        }
        
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.error || `HTTP ${response.status}`);
        }
        
        return responseData;
    } catch (error) {
        console.error(`API request failed: ${method} ${endpoint}`, error);
        throw error;
    }
}

/**
 * Show toast notification
 * Purpose: Display temporary notification messages to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Display duration in milliseconds
 */
function showToast(message, type = 'success', duration = 5000) {
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <strong>${getToastIcon(type)}</strong>
            <span>${message}</span>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Limit number of visible toasts (max 3)
    const toasts = toastContainer.querySelectorAll('.toast');
    if (toasts.length > 3) {
        toasts[0].remove();
    }
    
    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    });
}

/**
 * Get icon for toast notification type
 * Purpose: Return appropriate emoji icon for notification type
 * @param {string} type - Notification type
 * @returns {string} Icon emoji
 */
function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

/**
 * Format date for display
 * Purpose: Convert date to user-friendly format
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    
    return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format date and time for display
 * Purpose: Convert datetime to user-friendly format
 * @param {string|Date} datetime - DateTime to format
 * @returns {string} Formatted datetime string
 */
function formatDateTime(datetime) {
    if (!datetime) return '';
    
    const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
    
    return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format time for display
 * Purpose: Convert time to user-friendly format
 * @param {string|Date} time - Time to format
 * @returns {string} Formatted time string
 */
function formatTime(time) {
    if (!time) return '';
    
    const dateObj = typeof time === 'string' ? new Date(time) : time;
    
    return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Validate email address
 * Purpose: Check if email address is valid
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number
 * Purpose: Check if phone number is valid
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Sanitize HTML content
 * Purpose: Remove potentially dangerous HTML tags and attributes
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Debounce function calls
 * Purpose: Limit the rate at which a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show modal dialog
 * Purpose: Display modal with specified content
 * @param {string} modalId - ID of modal element
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focus first input in modal
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Close modal dialog
 * Purpose: Hide modal and restore page scroll
 * @param {HTMLElement} modal - Modal element to close
 */
function closeModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Clear form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

/**
 * Generate unique ID
 * Purpose: Create unique identifier for elements
 * @returns {string} Unique ID string
 */
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Copy text to clipboard
 * Purpose: Copy text to user's clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showToast('Failed to copy to clipboard', 'error');
        return false;
    }
}

/**
 * Download data as file
 * Purpose: Trigger download of data as specified file type
 * @param {string} data - Data to download
 * @param {string} filename - Name of file
 * @param {string} type - MIME type of file
 */
function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 * Purpose: Convert bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get current academic year
 * Purpose: Calculate current academic year based on date
 * @returns {string} Academic year (e.g., "2023-2024")
 */
function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    
    // Academic year typically starts in August/September
    if (month >= 7) { // August or later
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
}

/**
 * Calculate age from date of birth
 * Purpose: Calculate person's age in years
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const birth = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Capitalize first letter of string
 * Purpose: Convert first character to uppercase
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format name for display
 * Purpose: Format person's name consistently
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Formatted full name
 */
function formatName(firstName, lastName) {
    const first = capitalize(firstName || '');
    const last = capitalize(lastName || '');
    return `${first} ${last}`.trim();
}

// Add CSS for toast slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export utility functions to global scope
window.utils = {
    apiRequest,
    showToast,
    formatDate,
    formatDateTime,
    formatTime,
    isValidEmail,
    isValidPhone,
    sanitizeHTML,
    debounce,
    showModal,
    closeModal,
    generateId,
    copyToClipboard,
    downloadFile,
    formatFileSize,
    getCurrentAcademicYear,
    calculateAge,
    capitalize,
    formatName
};
