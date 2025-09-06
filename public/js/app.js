// app.js — Main application JavaScript
// Author: Vincent Onwuli
// Purpose: Initialize and manage the School OS frontend application
// Version: 1.0.0

// Global application state
const App = {
    currentUser: null,
    currentSection: 'dashboard',
    isAuthenticated: false,
    apiBaseUrl: '/api'
};

// DOM elements
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    loginScreen: document.getElementById('login-screen'),
    mainApp: document.getElementById('main-app'),
    currentUserSpan: document.getElementById('current-user'),
    navLinks: document.querySelectorAll('.nav-link'),
    contentSections: document.querySelectorAll('.content-section')
};

/**
 * Initialize the application
 * Purpose: Set up event listeners and check authentication status
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🏫 School OS - Initializing application...');
    
    try {
        // Show loading screen
        showLoadingScreen();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Check if user is already authenticated
        await checkAuthenticationStatus();
        
        // Hide loading screen after initialization
        setTimeout(() => {
            hideLoadingScreen();
        }, 1000);
        
    } catch (error) {
        console.error('Application initialization failed:', error);
        hideLoadingScreen();
        showToast('Application failed to initialize', 'error');
    }
});

/**
 * Set up all event listeners
 * Purpose: Bind events to DOM elements
 */
function initializeEventListeners() {
    // Navigation menu clicks
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Header button clicks
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('profile-btn')?.addEventListener('click', showProfile);
    document.getElementById('sync-btn')?.addEventListener('click', syncData);
    
    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
        if (e.target.classList.contains('modal-close')) {
            closeModal(e.target.closest('.modal'));
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Check if user is authenticated
 * Purpose: Verify authentication status and redirect accordingly
 */
async function checkAuthenticationStatus() {
    try {
        const token = localStorage.getItem('school_os_token');

        if (!token) {
            console.log('No authentication token found, showing login screen');
            showLoginScreen();
            return;
        }

        // For now, skip token verification since the endpoint might not exist
        // Just check if we have a token and assume it's valid
        // TODO: Implement proper token verification when auth/verify endpoint is ready

        console.log('Authentication token found, assuming valid');
        App.isAuthenticated = true;
        App.currentUser = { username: 'admin', full_name: 'Administrator' }; // Placeholder
        showMainApplication();

        /*
        // Verify token with server (commented out until endpoint is ready)
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
            showMainApplication();
        } else {
            // Token is invalid, remove it and show login
            localStorage.removeItem('school_os_token');
            showLoginScreen();
        }
        */
    } catch (error) {
        console.error('Authentication check failed:', error);
        showLoginScreen();
    }
}

/**
 * Handle navigation between sections
 * Purpose: Switch between different application sections
 */
function handleNavigation(e) {
    e.preventDefault();
    
    const targetSection = e.target.getAttribute('data-section');
    
    if (targetSection && targetSection !== App.currentSection) {
        switchToSection(targetSection);
    }
}

/**
 * Switch to a specific application section
 * Purpose: Show/hide sections and update navigation state
 */
function switchToSection(sectionName) {
    // Update navigation active state
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        }
    });
    
    // Update content sections
    elements.contentSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionName}-section`) {
            section.classList.add('active');
        }
    });
    
    App.currentSection = sectionName;
    
    // Load section-specific data
    loadSectionData(sectionName);
    
    console.log(`Switched to section: ${sectionName}`);
}

/**
 * Load data for specific section
 * Purpose: Fetch and display section-specific content
 */
async function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'students':
                await loadStudentsData();
                break;
            case 'attendance':
                await loadAttendanceData();
                break;
            case 'grades':
                await loadGradesData();
                break;
            case 'reports':
                await loadReportsData();
                break;
            case 'classes':
                await loadClassesData();
                break;
            case 'settings':
                await loadSettingsData();
                break;
            default:
                console.log(`No data loader for section: ${sectionName}`);
        }
    } catch (error) {
        console.error(`Failed to load data for section ${sectionName}:`, error);
        showToast(`Failed to load ${sectionName} data`, 'error');
    }
}

/**
 * Load dashboard statistics
 * Purpose: Fetch and display dashboard metrics
 */
async function loadDashboardData() {
    try {
        const response = await apiRequest('/reports/dashboard-stats');

        if (response.success) {
            const stats = response.data;

            // Update dashboard cards
            document.getElementById('total-students').textContent = stats.students?.total || '0';
            document.getElementById('today-attendance').textContent =
                `${stats.attendance?.today?.present || 0}/${stats.attendance?.today?.total || 0} (${stats.attendance?.today?.attendance_rate || 0}%)`;
            document.getElementById('active-classes').textContent = stats.classes?.total || '0';
            document.getElementById('recent-grades').textContent = '0'; // Placeholder for now

            // Update recent activity
            updateRecentActivity([
                {
                    type: 'Attendance',
                    description: `${stats.attendance?.today?.present || 0} students present today`,
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'Students',
                    description: `${stats.students?.total || 0} total students enrolled`,
                    timestamp: new Date().toISOString()
                }
            ]);
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Show placeholder data
        document.getElementById('total-students').textContent = '-';
        document.getElementById('today-attendance').textContent = '-';
        document.getElementById('active-classes').textContent = '-';
        document.getElementById('recent-grades').textContent = '-';
    }
}

/**
 * Update recent activity list
 * Purpose: Display recent system activities
 */
function updateRecentActivity(activities) {
    const activityList = document.getElementById('recent-activity-list');
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p>No recent activity</p>';
        return;
    }
    
    const activityHTML = activities.map(activity => `
        <div class="activity-item">
            <strong>${activity.type}</strong> - ${activity.description}
            <small>${formatDate(activity.timestamp)}</small>
        </div>
    `).join('');
    
    activityList.innerHTML = activityHTML;
}

/**
 * Handle user logout
 * Purpose: Clear authentication and return to login screen
 */
async function handleLogout() {
    try {
        // Call logout API
        await apiRequest('/auth/logout', 'POST');
        
        // Clear local storage
        localStorage.removeItem('school_os_token');
        
        // Reset application state
        App.currentUser = null;
        App.isAuthenticated = false;
        
        // Show login screen
        showLoginScreen();
        
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout failed:', error);
        // Force logout even if API call fails
        localStorage.removeItem('school_os_token');
        showLoginScreen();
    }
}

/**
 * Show user profile modal
 * Purpose: Display and allow editing of user profile
 */
function showProfile() {
    // TODO: Implement profile modal
    showToast('Profile functionality coming soon', 'info');
}

/**
 * Sync data with server
 * Purpose: Refresh all data from server
 */
async function syncData() {
    const syncBtn = document.getElementById('sync-btn');
    const originalText = syncBtn.textContent;
    
    try {
        syncBtn.textContent = '🔄 Syncing...';
        syncBtn.disabled = true;
        
        // Reload current section data
        await loadSectionData(App.currentSection);
        
        showToast('Data synced successfully', 'success');
    } catch (error) {
        console.error('Data sync failed:', error);
        showToast('Data sync failed', 'error');
    } finally {
        syncBtn.textContent = originalText;
        syncBtn.disabled = false;
    }
}

/**
 * Handle keyboard shortcuts
 * Purpose: Provide keyboard navigation and shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + key combinations
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                switchToSection('dashboard');
                break;
            case '2':
                e.preventDefault();
                switchToSection('students');
                break;
            case '3':
                e.preventDefault();
                switchToSection('attendance');
                break;
            case 'l':
                e.preventDefault();
                handleLogout();
                break;
        }
    }
    
    // Escape key to close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
            closeModal(openModal);
        }
    }
}

// Screen management functions
function showLoadingScreen() {
    elements.loadingScreen.classList.remove('hidden');
    elements.loginScreen.classList.add('hidden');
    elements.mainApp.classList.add('hidden');
}

function hideLoadingScreen() {
    elements.loadingScreen.classList.add('hidden');
}

function showLoginScreen() {
    elements.loadingScreen.classList.add('hidden');
    elements.loginScreen.classList.remove('hidden');
    elements.mainApp.classList.add('hidden');
}

function showMainApplication() {
    elements.loadingScreen.classList.add('hidden');
    elements.loginScreen.classList.add('hidden');
    elements.mainApp.classList.remove('hidden');
    
    // Update user info in header
    if (App.currentUser) {
        elements.currentUserSpan.textContent = 
            `Welcome, ${App.currentUser.full_name || App.currentUser.username}`;
    }
    
    // Load initial section data
    loadSectionData(App.currentSection);
}

// Students data loading is now handled in students.js
// This function is kept for compatibility
async function loadStudentsData() {
    console.log('Loading students data from app.js...');

    // Check if students.js has loaded its function
    if (typeof window.loadStudentsData !== 'undefined' && window.loadStudentsData !== loadStudentsData) {
        console.log('Calling students.js loadStudentsData function');
        return window.loadStudentsData();
    }

    // Fallback: call the function directly if it exists in students.js
    try {
        // Try to call the students API directly
        const response = await apiRequest('/students');
        if (response.success) {
            console.log('Students data loaded successfully:', response.data.length, 'students');
            populateStudentsTable(response.data);
        }
    } catch (error) {
        console.error('Failed to load students data:', error);
        showToast('Failed to load students data', 'error');
    }
}

async function loadAttendanceData() {
    console.log('Loading attendance data from app.js...');

    // Force call the attendance loading function
    try {
        // Load students for dropdown first
        const studentsResponse = await apiRequest('/students');
        if (studentsResponse.success) {
            const studentSelect = document.getElementById('attendance-student');
            if (studentSelect) {
                const options = studentsResponse.data.map(student =>
                    `<option value="${student.id}">${student.first_name} ${student.last_name} (${student.student_id})</option>`
                ).join('');
                studentSelect.innerHTML = '<option value="">Select Student</option>' + options;
            }
        }

        // Load today's attendance
        const response = await apiRequest('/attendance/today');
        const tableBody = document.getElementById('attendance-table-body');

        if (response.success && response.data.length > 0) {
            console.log('Attendance data loaded successfully:', response.data.length, 'records');

            // Populate attendance table
            const tableHTML = response.data.map(record => `
                <tr data-attendance-id="${record.id}">
                    <td>${record.student_id}</td>
                    <td>${record.first_name} ${record.last_name}</td>
                    <td>${record.class_name || 'Not assigned'}</td>
                    <td>
                        <span class="status-badge status-${record.status}">
                            ${record.status}
                        </span>
                    </td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-secondary edit-attendance-btn" data-attendance-id="${record.id}" title="Edit">✏️</button>
                        <button class="btn btn-sm btn-danger delete-attendance-btn" data-attendance-id="${record.id}" title="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');

            if (tableBody) {
                tableBody.innerHTML = tableHTML;

                // Add event listeners to attendance action buttons
                addAttendanceActionListeners();
            }
        } else {
            // Show empty state
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No attendance records for today</td></tr>';
            }
        }
    } catch (error) {
        console.error('Failed to load attendance data:', error);
        showToast('Failed to load attendance data', 'error');

        const tableBody = document.getElementById('attendance-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Failed to load attendance</td></tr>';
        }
    }
}

/**
 * Add event listeners to attendance action buttons
 * Purpose: Connect edit and delete buttons to their functions
 */
function addAttendanceActionListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-attendance-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const attendanceId = e.target.getAttribute('data-attendance-id');
            showToast(`Edit attendance ${attendanceId} - Feature coming soon!`, 'info');
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-attendance-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const attendanceId = e.target.getAttribute('data-attendance-id');
            if (confirm('Are you sure you want to delete this attendance record?')) {
                showToast(`Delete attendance ${attendanceId} - Feature coming soon!`, 'info');
            }
        });
    });
}

async function loadGradesData() {
    console.log('Loading grades data...');
}

async function loadReportsData() {
    console.log('Loading reports data...');
}

async function loadClassesData() {
    console.log('Loading classes data...');

    // Add event listeners to class action buttons
    setTimeout(() => {
        document.querySelectorAll('#classes-section .btn-sm').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.textContent.includes('✏️') ? 'Edit' : 'View';
                showToast(`${action} class - Feature coming soon!`, 'info');
            });
        });
    }, 100);
}

async function loadSettingsData() {
    console.log('Loading settings data...');
}

// Export App object for use in other modules
window.App = App;
