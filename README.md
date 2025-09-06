# Offline School OS

An offline-first, full-stack school management dashboard designed for classrooms without reliable internet access. Built with Node.js, Express, and SQLite for maximum portability and reliability.

## 🎯 Features

### Core Functionality
- **Student Records Management** - Complete student profiles with photos and parent information
- **Attendance Tracking** - Daily attendance with multiple status options and notes
- **Grade Management** - Subject-based grading with multiple assessment types
- **Report Card Generation** - Automated PDF report cards with customizable templates
- **Class Management** - Organize students by classes and grade levels
- **User Authentication** - Secure login system for teachers and administrators

### Offline-First Design
- **Local SQLite Database** - No internet required for daily operations
- **Data Export/Import** - Easy backup and data transfer capabilities
- **Responsive Design** - Works on tablets, laptops, and desktop computers
- **Print-Friendly Reports** - Generate physical copies without internet

## 🚀 Quick Start

### Prerequisites
- Node.js (v16.0.0 or higher)
- npm (v8.0.0 or higher)

### Installation

1. **Clone or download the project**
   ```bash
   cd school-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser to `http://localhost:3000`
   - Default login: admin/admin (change immediately)

### Production Setup

1. **Install dependencies**
   ```bash
   npm install --production
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export SESSION_SECRET=your-secure-secret-here
   export PORT=3000
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
school-os/
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── README.md                 # This file
│
├── db/                       # Database layer
│   ├── database.js           # SQLite connection and initialization
│   └── school_os.db          # SQLite database file (auto-created)
│
├── routes/                   # API route definitions
│   ├── student.js            # Student management endpoints
│   ├── attendance.js         # Attendance tracking endpoints
│   ├── reports.js            # Report generation endpoints
│   └── auth.js               # Authentication endpoints
│
├── controllers/              # Business logic layer
│   ├── studentController.js  # Student operations
│   ├── attendanceController.js
│   ├── reportController.js
│   └── authController.js
│
├── middleware/               # Custom middleware
│   ├── auth.js               # Authentication middleware
│   └── validation.js         # Input validation
│
├── public/                   # Static frontend files
│   ├── index.html            # Main application page
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side JavaScript
│   └── assets/               # Images, fonts, etc.
│
└── tests/                    # Test files
    ├── student.test.js
    ├── attendance.test.js
    └── setup.js
```

## 🔧 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Students
- `GET /api/students` - List all students (with filtering)
- `GET /api/students/:id` - Get specific student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Deactivate student
- `POST /api/students/bulk` - Bulk import students

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Record attendance
- `PUT /api/attendance/:id` - Update attendance record
- `GET /api/attendance/class/:classId/date/:date` - Get class attendance for specific date

### Reports
- `GET /api/reports/student/:id/report-card` - Generate student report card
- `GET /api/reports/class/:id/attendance-summary` - Class attendance summary
- `GET /api/reports/export/students` - Export student data

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm test           # Run test suite
npm run lint       # Check code style
npm run format     # Format code with Prettier
```

### Code Style Guide

This project follows professional coding standards:

- **File Headers**: Every file includes purpose, author, and version info
- **Function Documentation**: All functions have JSDoc-style comments
- **Error Handling**: Comprehensive try-catch blocks with meaningful messages
- **Consistent Naming**: camelCase for variables, PascalCase for classes
- **Database Queries**: Parameterized queries to prevent SQL injection

### Adding New Features

1. **Plan the feature** - Document requirements and API design
2. **Create database schema** - Add tables/columns in `db/database.js`
3. **Add routes** - Define endpoints in appropriate route file
4. **Implement controller** - Add business logic in controller file
5. **Add frontend** - Create UI components in `public/` directory
6. **Write tests** - Add unit tests for new functionality
7. **Update documentation** - Update this README and API docs

## 📊 Database Schema

### Core Tables
- **users** - Teacher/admin accounts
- **classes** - Class definitions and grade levels
- **students** - Student records and personal information
- **subjects** - Available subjects for grading
- **attendance** - Daily attendance records
- **grades** - Assessment scores and grades

### Key Relationships
- Students belong to Classes
- Attendance links Students and Classes by date
- Grades link Students and Subjects
- All records track which User created/modified them

## 🔒 Security Features

- **Password Hashing** - bcrypt for secure password storage
- **Session Management** - Secure session cookies
- **SQL Injection Prevention** - Parameterized queries
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configured for local-only access
- **Security Headers** - Helmet.js for basic security headers

## 📱 Browser Compatibility

- **Modern Browsers** - Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Support** - Responsive design for tablets and phones
- **Offline Capability** - Service worker for offline functionality (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Vincent Onwuli**
- Email: vinceonwuli7@gmail.com
- GitHub: [@Vinceszn](https://github.com/Vinceszn)

## 🆘 Support

For support and questions:
1. Check the documentation above
2. Review the code comments for implementation details
3. Create an issue on GitHub
4. Contact the author directly

---

**Built with ❤️ for educators who need reliable, offline-capable school management tools.**
