// students.js — Student management frontend functionality
// Author: Vincent Onwuli
// Purpose: Handle student-related UI interactions and API calls
// Version: 1.0.0

let studentsData = [];
let classesData = [];

/**
 * Load students data and populate the table
 * Purpose: Fetch students from API and display in table
 */
async function loadStudentsData() {
    try {
        console.log('Loading students data...');
        
        // Load students
        const studentsResponse = await apiRequest('/students');
        if (studentsResponse.success) {
            studentsData = studentsResponse.data;
            populateStudentsTable(studentsData);
        }
        
        // Load classes for filters and forms
        try {
            // Try to get classes from API first
            const classesResponse = await apiRequest('/classes');
            if (classesResponse.success) {
                classesData = classesResponse.data;
            } else {
                // Fallback to mock data
                classesData = [
                    { id: 1, name: 'JSS1A', grade_level: 'JSS1' },
                    { id: 2, name: 'JSS1B', grade_level: 'JSS1' },
                    { id: 3, name: 'JSS2A', grade_level: 'JSS2' },
                    { id: 4, name: 'JSS2B', grade_level: 'JSS2' },
                    { id: 5, name: 'JSS3A', grade_level: 'JSS3' },
                    { id: 6, name: 'JSS3B', grade_level: 'JSS3' }
                ];
            }
            populateClassFilters();
        } catch (error) {
            console.error('Failed to load classes:', error);
            // Use fallback data
            classesData = [
                { id: 1, name: 'JSS1A', grade_level: 'JSS1' },
                { id: 2, name: 'JSS1B', grade_level: 'JSS1' },
                { id: 3, name: 'JSS2A', grade_level: 'JSS2' },
                { id: 4, name: 'JSS2B', grade_level: 'JSS2' },
                { id: 5, name: 'JSS3A', grade_level: 'JSS3' },
                { id: 6, name: 'JSS3B', grade_level: 'JSS3' }
            ];
            populateClassFilters();
        }
        
    } catch (error) {
        console.error('Failed to load students data:', error);
        showToast('Failed to load students data', 'error');
        
        // Show error in table
        const tableBody = document.getElementById('students-table-body');
        tableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Failed to load students</td></tr>';
    }
}

/**
 * Populate the students table with data
 * Purpose: Display students in the data table
 */
function populateStudentsTable(students) {
    const tableBody = document.getElementById('students-table-body');
    
    if (!students || students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No students found</td></tr>';
        return;
    }
    
    const tableHTML = students.map(student => `
        <tr data-student-id="${student.id}">
            <td>${student.student_id}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.class_name || 'Not assigned'}</td>
            <td>${student.parent_name || 'Not provided'}</td>
            <td>
                <span class="status-badge status-${student.status}">
                    ${student.status || 'active'}
                </span>
            </td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-secondary edit-student-btn" data-student-id="${student.id}" title="Edit">
                    ✏️
                </button>
                <button class="btn btn-sm btn-info view-student-btn" data-student-id="${student.id}" title="View">
                    👁️
                </button>
                <button class="btn btn-sm btn-danger delete-student-btn" data-student-id="${student.id}" title="Delete">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = tableHTML;

    // Add event listeners to action buttons
    addStudentActionListeners();
}

/**
 * Add event listeners to student action buttons
 * Purpose: Connect edit, view, delete buttons to their functions
 */
function addStudentActionListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.getAttribute('data-student-id');
            editStudent(studentId);
        });
    });

    // View buttons
    document.querySelectorAll('.view-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.getAttribute('data-student-id');
            viewStudent(studentId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.getAttribute('data-student-id');
            deleteStudent(studentId);
        });
    });
}

/**
 * Populate class filter dropdown
 * Purpose: Fill class filter with available classes
 */
function populateClassFilters() {
    const classFilter = document.getElementById('class-filter');
    const studentClassSelect = document.getElementById('student-class');
    
    if (classFilter) {
        const classOptions = classesData.map(cls => 
            `<option value="${cls.id}">${cls.name}</option>`
        ).join('');
        classFilter.innerHTML = '<option value="">All Classes</option>' + classOptions;
    }
    
    if (studentClassSelect) {
        const classOptions = classesData.map(cls => 
            `<option value="${cls.id}">${cls.name}</option>`
        ).join('');
        studentClassSelect.innerHTML = '<option value="">Select Class</option>' + classOptions;
    }
}

/**
 * Handle student search
 * Purpose: Filter students based on search input
 */
function handleStudentSearch() {
    const searchInput = document.getElementById('student-search');
    const classFilter = document.getElementById('class-filter');
    const statusFilter = document.getElementById('status-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterStudents);
    }
    if (classFilter) {
        classFilter.addEventListener('change', filterStudents);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterStudents);
    }
}

/**
 * Filter students based on search criteria
 * Purpose: Apply filters to student list
 */
function filterStudents() {
    const searchTerm = document.getElementById('student-search')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('class-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'active';
    
    let filteredStudents = studentsData;
    
    // Apply search filter
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(student => 
            student.first_name.toLowerCase().includes(searchTerm) ||
            student.last_name.toLowerCase().includes(searchTerm) ||
            student.student_id.toLowerCase().includes(searchTerm) ||
            (student.parent_name && student.parent_name.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply class filter
    if (classFilter) {
        filteredStudents = filteredStudents.filter(student => 
            student.class_id == classFilter
        );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filteredStudents = filteredStudents.filter(student => 
            student.status === statusFilter
        );
    }
    
    populateStudentsTable(filteredStudents);
}

/**
 * Show add student modal
 * Purpose: Display modal for adding new student
 */
function showAddStudentModal() {
    const modal = document.getElementById('student-modal');
    const modalTitle = document.getElementById('student-modal-title');
    const form = document.getElementById('student-form');
    
    modalTitle.textContent = 'Add New Student';
    form.reset();
    form.removeAttribute('data-student-id');
    
    modal.classList.remove('hidden');
}

/**
 * Edit student
 * Purpose: Show edit modal with student data
 */
async function editStudent(studentId) {
    try {
        const response = await apiRequest(`/students/${studentId}`);
        
        if (response.success) {
            const student = response.data;
            showEditStudentModal(student);
        } else {
            showToast('Failed to load student data', 'error');
        }
    } catch (error) {
        console.error('Failed to load student for editing:', error);
        showToast('Failed to load student data', 'error');
    }
}

/**
 * Show edit student modal
 * Purpose: Display modal with student data for editing
 */
function showEditStudentModal(student) {
    const modal = document.getElementById('student-modal');
    const modalTitle = document.getElementById('student-modal-title');
    const form = document.getElementById('student-form');
    
    modalTitle.textContent = 'Edit Student';
    form.setAttribute('data-student-id', student.id);
    
    // Populate form fields
    document.getElementById('student-id').value = student.student_id || '';
    document.getElementById('first-name').value = student.first_name || '';
    document.getElementById('last-name').value = student.last_name || '';
    document.getElementById('date-of-birth').value = student.date_of_birth || '';
    document.getElementById('gender').value = student.gender || '';
    document.getElementById('student-class').value = student.class_id || '';
    document.getElementById('parent-name').value = student.parent_name || '';
    document.getElementById('parent-phone').value = student.parent_phone || '';
    document.getElementById('parent-email').value = student.parent_email || '';
    document.getElementById('address').value = student.address || '';
    
    modal.classList.remove('hidden');
}

/**
 * View student details
 * Purpose: Show student information in a read-only view
 */
async function viewStudent(studentId) {
    try {
        const response = await apiRequest(`/students/${studentId}`);
        
        if (response.success) {
            const student = response.data;
            showToast(`Viewing ${student.first_name} ${student.last_name}`, 'info');
            // TODO: Implement detailed view modal
        } else {
            showToast('Failed to load student data', 'error');
        }
    } catch (error) {
        console.error('Failed to load student details:', error);
        showToast('Failed to load student data', 'error');
    }
}

/**
 * Delete student
 * Purpose: Deactivate student after confirmation
 */
async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to deactivate this student?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/students/${studentId}/status`, 'PATCH', {
            status: 'inactive',
            notes: 'Deactivated via web interface'
        });
        
        if (response.success) {
            showToast('Student deactivated successfully', 'success');
            await loadStudentsData(); // Reload the table
        } else {
            showToast('Failed to deactivate student', 'error');
        }
    } catch (error) {
        console.error('Failed to delete student:', error);
        showToast('Failed to deactivate student', 'error');
    }
}

/**
 * Handle student form submission
 * Purpose: Save new or updated student data
 */
async function handleStudentFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const studentId = form.getAttribute('data-student-id');
    const formData = new FormData(form);
    
    const studentData = {
        student_id: formData.get('student_id'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        date_of_birth: formData.get('date_of_birth'),
        gender: formData.get('gender'),
        class_id: formData.get('class_id') || null,
        parent_name: formData.get('parent_name'),
        parent_phone: formData.get('parent_phone'),
        parent_email: formData.get('parent_email'),
        address: formData.get('address')
    };
    
    try {
        let response;
        
        if (studentId) {
            // Update existing student
            response = await apiRequest(`/students/${studentId}`, 'PUT', studentData);
        } else {
            // Create new student
            response = await apiRequest('/students', 'POST', studentData);
        }
        
        if (response.success) {
            showToast(`Student ${studentId ? 'updated' : 'created'} successfully`, 'success');
            closeModal(document.getElementById('student-modal'));
            await loadStudentsData(); // Reload the table
        } else {
            showToast(response.error || 'Failed to save student', 'error');
        }
    } catch (error) {
        console.error('Failed to save student:', error);
        showToast('Failed to save student', 'error');
    }
}

// Initialize student management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    const addStudentBtn = document.getElementById('add-student-btn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', showAddStudentModal);
    }
    
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', handleStudentFormSubmit);
    }
    
    const cancelBtn = document.getElementById('cancel-student');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeModal(document.getElementById('student-modal'));
        });
    }
    
    // Set up search and filters
    handleStudentSearch();
});

// Make functions available globally
window.editStudent = editStudent;
window.viewStudent = viewStudent;
window.deleteStudent = deleteStudent;
window.loadStudentsData = loadStudentsData;
