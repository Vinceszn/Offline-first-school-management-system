// db/database.js — SQLite database initialization and connection management
// Author: Vincent Onwuli
// Purpose: Handle database setup, connections, and schema initialization
// Version: 1.0.0

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

// Database file path - stores in db directory
const DB_PATH = path.join(__dirname, 'school_os.db');

// Database connection instance
let db = null;

/**
 * Initialize the SQLite database
 * Creates tables if they don't exist and sets up initial data
 * @returns {Promise<sqlite3.Database>} Database connection
 */
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Create database connection
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('📁 Connected to SQLite database at:', DB_PATH);
    });

    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('❌ Error enabling foreign keys:', err.message);
        reject(err);
        return;
      }
    });

    // Create tables
    createTables()
      .then(() => {
        console.log('✅ Database tables created successfully');
        resolve(db);
      })
      .catch(reject);
  });
}

/**
 * Create all necessary database tables
 * @returns {Promise<void>}
 */
async function createTables() {
  const createTableQueries = [
    // Users table for authentication
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'teacher',
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Classes table
    `CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      teacher_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users (id)
    )`,

    // Students table
    `CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth DATE,
      gender TEXT,
      class_id INTEGER,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      address TEXT,
      enrollment_date DATE DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id)
    )`,

    // Subjects table
    `CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Attendance table
    `CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'present',
      notes TEXT,
      recorded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id),
      FOREIGN KEY (recorded_by) REFERENCES users (id),
      UNIQUE(student_id, date)
    )`,

    // Grades table
    `CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      assessment_type TEXT NOT NULL,
      score REAL NOT NULL,
      max_score REAL NOT NULL,
      assessment_date DATE NOT NULL,
      term TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      notes TEXT,
      recorded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id),
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      FOREIGN KEY (recorded_by) REFERENCES users (id)
    )`,

    // School settings table for customization
    `CREATE TABLE IF NOT EXISTS school_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type TEXT DEFAULT 'text',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // Execute each table creation query
  for (const query of createTableQueries) {
    await executeQuery(query);
  }

  // Insert default data
  await insertDefaultData();
}

/**
 * Insert default data for initial setup
 * @returns {Promise<void>}
 */
async function insertDefaultData() {
  const bcrypt = require('bcrypt');

  // Create default admin user
  const adminExists = await selectOneQuery('SELECT id FROM users WHERE username = ?', ['admin']);

  if (!adminExists) {
    const adminPasswordHash = await bcrypt.hash('admin', 12);
    await executeQuery(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@school-os.local', adminPasswordHash, 'System Administrator', 'admin']
    );
    console.log('✅ Default admin user created (username: admin, password: admin)');
  }

  // Default subjects
  const defaultSubjects = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English Language', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SS' },
    { name: 'Physical Education', code: 'PE' }
  ];

  for (const subject of defaultSubjects) {
    await executeQuery(
      'INSERT OR IGNORE INTO subjects (name, code) VALUES (?, ?)',
      [subject.name, subject.code]
    );
  }

  console.log('✅ Default subjects inserted');

  // Add sample classes (JSS1-JSS3)
  const sampleClasses = [
    { name: 'JSS1A', grade_level: 'JSS1', academic_year: '2024-2025' },
    { name: 'JSS1B', grade_level: 'JSS1', academic_year: '2024-2025' },
    { name: 'JSS2A', grade_level: 'JSS2', academic_year: '2024-2025' },
    { name: 'JSS2B', grade_level: 'JSS2', academic_year: '2024-2025' },
    { name: 'JSS3A', grade_level: 'JSS3', academic_year: '2024-2025' },
    { name: 'JSS3B', grade_level: 'JSS3', academic_year: '2024-2025' }
  ];

  for (const classData of sampleClasses) {
    await executeQuery(
      'INSERT OR IGNORE INTO classes (name, grade_level, academic_year) VALUES (?, ?, ?)',
      [classData.name, classData.grade_level, classData.academic_year]
    );
  }

  // Add sample students for JSS1-JSS3 (3 classrooms worth)
  const sampleStudents = [
    // JSS1A Students
    { student_id: 'JSS1A001', first_name: 'Adebayo', last_name: 'Ogundimu', class_id: 1, parent_name: 'Mrs. Folake Ogundimu', parent_phone: '080-1234-5001', gender: 'male' },
    { student_id: 'JSS1A002', first_name: 'Chioma', last_name: 'Okwu', class_id: 1, parent_name: 'Mr. Emeka Okwu', parent_phone: '080-1234-5002', gender: 'female' },
    { student_id: 'JSS1A003', first_name: 'Ibrahim', last_name: 'Musa', class_id: 1, parent_name: 'Alhaji Musa Ibrahim', parent_phone: '080-1234-5003', gender: 'male' },
    { student_id: 'JSS1A004', first_name: 'Blessing', last_name: 'Eze', class_id: 1, parent_name: 'Mrs. Grace Eze', parent_phone: '080-1234-5004', gender: 'female' },
    { student_id: 'JSS1A005', first_name: 'Kemi', last_name: 'Adebisi', class_id: 1, parent_name: 'Dr. Adebisi Kemi', parent_phone: '080-1234-5005', gender: 'female' },

    // JSS1B Students
    { student_id: 'JSS1B001', first_name: 'Tunde', last_name: 'Bakare', class_id: 2, parent_name: 'Pastor Bakare', parent_phone: '080-1234-5006', gender: 'male' },
    { student_id: 'JSS1B002', first_name: 'Fatima', last_name: 'Aliyu', class_id: 2, parent_name: 'Mallam Aliyu', parent_phone: '080-1234-5007', gender: 'female' },
    { student_id: 'JSS1B003', first_name: 'Chinedu', last_name: 'Okafor', class_id: 2, parent_name: 'Chief Okafor', parent_phone: '080-1234-5008', gender: 'male' },
    { student_id: 'JSS1B004', first_name: 'Aisha', last_name: 'Bello', class_id: 2, parent_name: 'Mrs. Bello Aisha', parent_phone: '080-1234-5009', gender: 'female' },
    { student_id: 'JSS1B005', first_name: 'Emeka', last_name: 'Nwosu', class_id: 2, parent_name: 'Mr. Nwosu Emeka', parent_phone: '080-1234-5010', gender: 'male' },

    // JSS2A Students
    { student_id: 'JSS2A001', first_name: 'Funmi', last_name: 'Adeyemi', class_id: 3, parent_name: 'Prof. Adeyemi', parent_phone: '080-1234-5011', gender: 'female' },
    { student_id: 'JSS2A002', first_name: 'Usman', last_name: 'Garba', class_id: 3, parent_name: 'Alhaji Garba', parent_phone: '080-1234-5012', gender: 'male' },
    { student_id: 'JSS2A003', first_name: 'Ngozi', last_name: 'Okonkwo', class_id: 3, parent_name: 'Mrs. Okonkwo', parent_phone: '080-1234-5013', gender: 'female' },
    { student_id: 'JSS2A004', first_name: 'Segun', last_name: 'Oladele', class_id: 3, parent_name: 'Mr. Oladele', parent_phone: '080-1234-5014', gender: 'male' },
    { student_id: 'JSS2A005', first_name: 'Hauwa', last_name: 'Abdullahi', class_id: 3, parent_name: 'Dr. Abdullahi', parent_phone: '080-1234-5015', gender: 'female' },

    // JSS2B Students
    { student_id: 'JSS2B001', first_name: 'Olumide', last_name: 'Fashola', class_id: 4, parent_name: 'Engr. Fashola', parent_phone: '080-1234-5016', gender: 'male' },
    { student_id: 'JSS2B002', first_name: 'Amina', last_name: 'Yusuf', class_id: 4, parent_name: 'Mrs. Yusuf', parent_phone: '080-1234-5017', gender: 'female' },
    { student_id: 'JSS2B003', first_name: 'Chukwuma', last_name: 'Igwe', class_id: 4, parent_name: 'Chief Igwe', parent_phone: '080-1234-5018', gender: 'male' },
    { student_id: 'JSS2B004', first_name: 'Zainab', last_name: 'Mohammed', class_id: 4, parent_name: 'Imam Mohammed', parent_phone: '080-1234-5019', gender: 'female' },
    { student_id: 'JSS2B005', first_name: 'Biodun', last_name: 'Ajayi', class_id: 4, parent_name: 'Mr. Ajayi', parent_phone: '080-1234-5020', gender: 'male' },

    // JSS3A Students
    { student_id: 'JSS3A001', first_name: 'Folake', last_name: 'Ogundipe', class_id: 5, parent_name: 'Dr. Ogundipe', parent_phone: '080-1234-5021', gender: 'female' },
    { student_id: 'JSS3A002', first_name: 'Murtala', last_name: 'Sani', class_id: 5, parent_name: 'Alhaji Sani', parent_phone: '080-1234-5022', gender: 'male' },
    { student_id: 'JSS3A003', first_name: 'Chinelo', last_name: 'Udoka', class_id: 5, parent_name: 'Mrs. Udoka', parent_phone: '080-1234-5023', gender: 'female' },
    { student_id: 'JSS3A004', first_name: 'Kayode', last_name: 'Bamidele', class_id: 5, parent_name: 'Mr. Bamidele', parent_phone: '080-1234-5024', gender: 'male' },
    { student_id: 'JSS3A005', first_name: 'Maryam', last_name: 'Umar', class_id: 5, parent_name: 'Dr. Umar', parent_phone: '080-1234-5025', gender: 'female' },

    // JSS3B Students
    { student_id: 'JSS3B001', first_name: 'Taiwo', last_name: 'Adeleke', class_id: 6, parent_name: 'Sen. Adeleke', parent_phone: '080-1234-5026', gender: 'male' },
    { student_id: 'JSS3B002', first_name: 'Halima', last_name: 'Shehu', class_id: 6, parent_name: 'Mrs. Shehu', parent_phone: '080-1234-5027', gender: 'female' },
    { student_id: 'JSS3B003', first_name: 'Ikechukwu', last_name: 'Nnaji', class_id: 6, parent_name: 'Prof. Nnaji', parent_phone: '080-1234-5028', gender: 'male' },
    { student_id: 'JSS3B004', first_name: 'Ronke', last_name: 'Salami', class_id: 6, parent_name: 'Mrs. Salami', parent_phone: '080-1234-5029', gender: 'female' },
    { student_id: 'JSS3B005', first_name: 'Ahmed', last_name: 'Lawal', class_id: 6, parent_name: 'Alhaji Lawal', parent_phone: '080-1234-5030', gender: 'male' }
  ];

  for (const student of sampleStudents) {
    await executeQuery(
      'INSERT OR IGNORE INTO students (student_id, first_name, last_name, class_id, parent_name, parent_phone) VALUES (?, ?, ?, ?, ?, ?)',
      [student.student_id, student.first_name, student.last_name, student.class_id, student.parent_name, student.parent_phone]
    );
  }

  // Add sample attendance records for today (more realistic distribution)
  const today = new Date().toISOString().split('T')[0];
  const attendanceStatuses = ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'absent', 'late', 'excused'];
  const sampleAttendance = [];

  // Generate attendance for first 20 students (mix of all classes)
  for (let i = 1; i <= 20; i++) {
    const randomStatus = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
    sampleAttendance.push({
      student_id: i,
      date: today,
      status: randomStatus
    });
  }

  for (const attendance of sampleAttendance) {
    await executeQuery(
      'INSERT OR IGNORE INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
      [attendance.student_id, attendance.date, attendance.status]
    );
  }

  console.log('✅ Sample data inserted (classes, students, attendance)');

  // Add default school settings
  const defaultSettings = [
    { key: 'school_name', value: 'Sample Elementary School', type: 'text', description: 'Name of the school' },
    { key: 'school_logo', value: '', type: 'file', description: 'School logo image file path' },
    { key: 'school_address', value: '123 Education Street, Learning City', type: 'text', description: 'School address' },
    { key: 'school_phone', value: '(555) 123-4567', type: 'text', description: 'School phone number' },
    { key: 'school_email', value: 'info@sampleschool.edu', type: 'email', description: 'School email address' },
    { key: 'academic_year', value: '2024-2025', type: 'text', description: 'Current academic year' },
    { key: 'theme_color', value: '#6366f1', type: 'color', description: 'Primary theme color' }
  ];

  for (const setting of defaultSettings) {
    await executeQuery(
      'INSERT OR IGNORE INTO school_settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
      [setting.key, setting.value, setting.type, setting.description]
    );
  }

  console.log('✅ Default school settings inserted');
}

/**
 * Execute a database query with parameters
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} Query result
 */
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error('❌ Database query error:', err.message);
        console.error('Query:', query);
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Execute a SELECT query and return all results
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
function selectQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Database select error:', err.message);
        console.error('Query:', query);
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

/**
 * Execute a SELECT query and return first result
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Query result
 */
function selectOneQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('❌ Database select one error:', err.message);
        console.error('Query:', query);
        reject(err);
        return;
      }
      resolve(row || null);
    });
  });
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('📁 Database connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Export database functions
module.exports = {
  initializeDatabase,
  executeQuery,
  selectQuery,
  selectOneQuery,
  closeDatabase,
  getDatabase: () => db
};
