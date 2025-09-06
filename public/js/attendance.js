// attendance.js — Attendance management frontend functionality
// Author: Vincent Onwuli
// Purpose: Handle attendance-related UI interactions and API calls
// Version: 1.0.0

let attendanceData = [];

/**
 * Load attendance data and populate the table
 * Purpose: Fetch attendance from API and display in table
 */
async function loadAttendanceData() {
    try {
        console.log('Loading attendance data...');

        // Load students first for the dropdown
        await loadStudentsForDropdown();

        // Load today's attendance
        const response = await apiRequest('/attendance/today');
        if (response.success) {
            attendanceData = response.data;
            populateAttendanceTable(attendanceData);
        } else {
            // Show empty state if no data
            const tableBody = document.getElementById('attendance-table-body');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No attendance records for today</td></tr>';
            }
        }

    } catch (error) {
        console.error('Failed to load attendance data:', error);
        showToast('Failed to load attendance data', 'error');

        // Show error in table
        const tableBody = document.getElementById('attendance-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Failed to load attendance</td></tr>';
        }
    }
}

/**
 * Load students for dropdown
 * Purpose: Populate student dropdown in attendance modal
 */
async function loadStudentsForDropdown() {
    try {
        const response = await apiRequest('/students');
        if (response.success) {
            const studentSelect = document.getElementById('attendance-student');
            if (studentSelect) {
                const options = response.data.map(student =>
                    `<option value="${student.id}">${student.first_name} ${student.last_name} (${student.student_id})</option>`
                ).join('');
                studentSelect.innerHTML = '<option value="">Select Student</option>' + options;
            }
        }
    } catch (error) {
        console.error('Failed to load students for dropdown:', error);
    }
}

/**
 * Populate the attendance table with data
 * Purpose: Display attendance in the data table
 */
function populateAttendanceTable(attendance) {
    const tableBody = document.getElementById('attendance-table-body');
    
    if (!tableBody) {
        console.warn('Attendance table body not found');
        return;
    }
    
    if (!attendance || attendance.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No attendance records found</td></tr>';
        return;
    }
    
    const tableHTML = attendance.map(record => `
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
                <button class="btn btn-sm btn-secondary" onclick="editAttendance(${record.id})" title="Edit">
                    ✏️
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAttendance(${record.id})" title="Delete">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = tableHTML;
}

/**
 * Show record attendance modal
 * Purpose: Display modal for recording new attendance
 */
function showRecordAttendanceModal() {
    const modal = document.getElementById('attendance-modal');
    const modalTitle = document.getElementById('attendance-modal-title');
    const form = document.getElementById('attendance-form');
    
    if (modal && modalTitle && form) {
        modalTitle.textContent = 'Record Attendance';
        form.reset();
        form.removeAttribute('data-attendance-id');
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('attendance-date');
        if (dateInput) {
            dateInput.value = today;
        }
        
        modal.classList.remove('hidden');
    }
}

/**
 * Edit attendance record
 * Purpose: Show edit modal with attendance data
 */
async function editAttendance(attendanceId) {
    try {
        // Find the attendance record in our data
        const record = attendanceData.find(a => a.id === attendanceId);
        
        if (record) {
            showEditAttendanceModal(record);
        } else {
            showToast('Attendance record not found', 'error');
        }
    } catch (error) {
        console.error('Failed to load attendance for editing:', error);
        showToast('Failed to load attendance data', 'error');
    }
}

/**
 * Show edit attendance modal
 * Purpose: Display modal with attendance data for editing
 */
function showEditAttendanceModal(record) {
    const modal = document.getElementById('attendance-modal');
    const modalTitle = document.getElementById('attendance-modal-title');
    const form = document.getElementById('attendance-form');
    
    if (modal && modalTitle && form) {
        modalTitle.textContent = 'Edit Attendance';
        form.setAttribute('data-attendance-id', record.id);
        
        // Populate form fields
        const studentSelect = document.getElementById('attendance-student');
        const dateInput = document.getElementById('attendance-date');
        const statusSelect = document.getElementById('attendance-status');
        const notesInput = document.getElementById('attendance-notes');
        
        if (studentSelect) {
            studentSelect.value = record.student_id || '';
        }
        if (dateInput) {
            dateInput.value = record.date || '';
        }
        if (statusSelect) {
            statusSelect.value = record.status || 'present';
        }
        if (notesInput) {
            notesInput.value = record.notes || '';
        }
        
        modal.classList.remove('hidden');
    }
}

/**
 * Delete attendance record
 * Purpose: Remove attendance record after confirmation
 */
async function deleteAttendance(attendanceId) {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/attendance/${attendanceId}`, 'DELETE');
        
        if (response.success) {
            showToast('Attendance record deleted successfully', 'success');
            await loadAttendanceData(); // Reload the table
        } else {
            showToast('Failed to delete attendance record', 'error');
        }
    } catch (error) {
        console.error('Failed to delete attendance:', error);
        showToast('Failed to delete attendance record', 'error');
    }
}

/**
 * Handle attendance form submission
 * Purpose: Save new or updated attendance data
 */
async function handleAttendanceFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const attendanceId = form.getAttribute('data-attendance-id');
    const formData = new FormData(form);
    
    const attendanceData = {
        student_id: formData.get('student_id'),
        date: formData.get('date'),
        status: formData.get('status'),
        notes: formData.get('notes')
    };
    
    try {
        let response;
        
        if (attendanceId) {
            // Update existing attendance
            response = await apiRequest(`/attendance/${attendanceId}`, 'PUT', attendanceData);
        } else {
            // Create new attendance
            response = await apiRequest('/attendance', 'POST', attendanceData);
        }
        
        if (response.success) {
            showToast(`Attendance ${attendanceId ? 'updated' : 'recorded'} successfully`, 'success');
            closeModal(document.getElementById('attendance-modal'));
            await loadAttendanceData(); // Reload the table
        } else {
            showToast(response.error || 'Failed to save attendance', 'error');
        }
    } catch (error) {
        console.error('Failed to save attendance:', error);
        showToast('Failed to save attendance', 'error');
    }
}

/**
 * Mark all students present for today
 * Purpose: Bulk mark all students as present
 */
async function markAllPresent() {
    if (!confirm('Mark all students as present for today?')) {
        return;
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const response = await apiRequest('/attendance/mark-all-present', 'POST', {
            class_id: 1, // Default to first class for now
            date: today,
            notes: 'Bulk marked present via web interface'
        });
        
        if (response.success) {
            showToast('All students marked present', 'success');
            await loadAttendanceData(); // Reload the table
        } else {
            showToast('Failed to mark all present', 'error');
        }
    } catch (error) {
        console.error('Failed to mark all present:', error);
        showToast('Failed to mark all present', 'error');
    }
}

// Initialize attendance management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date in the date filter
    const today = new Date().toISOString().split('T')[0];
    const dateFilter = document.getElementById('attendance-date-filter');
    if (dateFilter) {
        dateFilter.value = today;
    }

    // Set up event listeners
    const recordAttendanceBtn = document.getElementById('record-attendance-btn');
    if (recordAttendanceBtn) {
        recordAttendanceBtn.addEventListener('click', showRecordAttendanceModal);
    }

    const markAllPresentBtn = document.getElementById('mark-all-present-btn');
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', markAllPresent);
    }

    const attendanceForm = document.getElementById('attendance-form');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', handleAttendanceFormSubmit);
    }

    const cancelBtn = document.getElementById('cancel-attendance');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeModal(document.getElementById('attendance-modal'));
        });
    }
});

// Make functions available globally
window.editAttendance = editAttendance;
window.deleteAttendance = deleteAttendance;
window.markAllPresent = markAllPresent;
window.loadAttendanceData = loadAttendanceData;

// Also call loadAttendanceData when the page loads if we're on the attendance section
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the attendance section and load data
    if (window.location.hash === '#attendance' || document.querySelector('#attendance-section.active')) {
        setTimeout(() => {
            loadAttendanceData();
        }, 1000);
    }
});
