# School OS Setup Guide

Complete setup instructions for the Offline School Management System.

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd school-os
npm install
```

### Step 2: Start the Server
```bash
npm start
```

### Step 3: Access the Application
- Open your browser to `http://localhost:3000`
- Login with default credentials: `admin` / `admin`
- **Important:** Change the default password immediately!

## 📋 Detailed Setup Instructions

### Prerequisites
- **Node.js** v16.0.0 or higher
- **npm** v8.0.0 or higher
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation Steps

1. **Download/Clone the Project**
   ```bash
   # If you have the project files
   cd school-os
   
   # Or if cloning from repository
   git clone <repository-url>
   cd school-os
   ```

2. **Install Node.js Dependencies**
   ```bash
   npm install
   ```
   
   This installs all required packages:
   - Express.js (web server)
   - SQLite3 (database)
   - Authentication libraries
   - PDF generation tools
   - Security middleware

3. **Environment Configuration (Optional)**
   ```bash
   # Create .env file for production settings
   echo "NODE_ENV=production" > .env
   echo "PORT=3000" >> .env
   echo "SESSION_SECRET=your-secure-secret-here" >> .env
   ```

4. **Start the Application**
   ```bash
   # Development mode (auto-restart on changes)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the Application**
   - Open browser to `http://localhost:3000`
   - You should see the School OS login screen

### First-Time Setup

1. **Login with Default Credentials**
   - Username: `admin`
   - Password: `admin`

2. **Change Default Password**
   - Click "Profile" button in top-right
   - Change password to something secure
   - Update full name and email

3. **Create Additional Users**
   - Go to Settings → User Management
   - Add teacher accounts as needed
   - Assign appropriate roles

4. **Set Up Classes**
   - Navigate to Classes section
   - Create grade levels and class names
   - Assign teachers to classes

5. **Add Students**
   - Go to Students section
   - Add students individually or use bulk import
   - Assign students to appropriate classes

## 🗄️ Database Information

### Database Location
- **File:** `db/school_os.db`
- **Type:** SQLite (no server required)
- **Backup:** Simply copy the `.db` file

### Database Schema
The system automatically creates these tables:
- `users` - Teacher/admin accounts
- `classes` - Class definitions
- `students` - Student records
- `subjects` - Available subjects
- `attendance` - Daily attendance records
- `grades` - Assessment scores

### Backup Strategy
```bash
# Manual backup
cp db/school_os.db backups/school_os_$(date +%Y%m%d).db

# Automated daily backup (Linux/Mac)
echo "0 2 * * * cp /path/to/school-os/db/school_os.db /path/to/backups/school_os_\$(date +\%Y\%m\%d).db" | crontab -
```

## 🔧 Configuration Options

### Server Configuration
Edit `server.js` to modify:
- Port number (default: 3000)
- Session timeout
- File upload limits
- CORS settings

### Frontend Configuration
Edit `public/js/app.js` to modify:
- API endpoints
- UI refresh intervals
- Default page sizes

### Security Settings
- Change default session secret
- Enable HTTPS in production
- Configure firewall rules
- Set up regular backups

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome** 80+ ✅
- **Firefox** 75+ ✅
- **Safari** 13+ ✅
- **Edge** 80+ ✅

### Mobile Support
- **Tablets** - Full functionality
- **Phones** - Basic functionality (responsive design)

## 🚨 Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**2. Database permission errors**
```bash
# Ensure write permissions for db directory
chmod 755 db/
chmod 644 db/school_os.db
```

**3. Port already in use**
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process or use different port
PORT=3001 npm start
```

**4. Login not working**
- Check browser console for errors
- Verify database file exists
- Try clearing browser cache/cookies

**5. Slow performance**
- Check available disk space
- Restart the application
- Consider database optimization

### Getting Help

1. **Check the logs** - Look at console output for error messages
2. **Browser Developer Tools** - Check Network and Console tabs
3. **Database integrity** - Verify `school_os.db` file exists and is readable
4. **File permissions** - Ensure proper read/write permissions

## 🔒 Security Considerations

### Production Deployment
1. **Change default credentials** immediately
2. **Use HTTPS** with SSL certificates
3. **Set strong session secret** in environment variables
4. **Enable firewall** to restrict access
5. **Regular backups** of database file
6. **Update dependencies** regularly

### Network Security
- Run on internal network only (not internet-facing)
- Use VPN for remote access
- Implement IP whitelisting if needed

### Data Protection
- Regular database backups
- Encrypt sensitive data at rest
- Secure physical access to server
- Train users on password security

## 📊 Performance Optimization

### For Large Schools (500+ students)
1. **Increase memory allocation**
   ```bash
   node --max-old-space-size=4096 server.js
   ```

2. **Database optimization**
   - Regular VACUUM operations
   - Index optimization
   - Archive old data

3. **Caching strategies**
   - Enable browser caching
   - Implement server-side caching
   - Optimize image sizes

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks
- **Weekly:** Check disk space and performance
- **Monthly:** Update dependencies and backup database
- **Quarterly:** Review user accounts and permissions
- **Annually:** Full system backup and disaster recovery test

### Updating the Application
1. Backup current database
2. Download new version
3. Run `npm install` for new dependencies
4. Test with backup data
5. Deploy to production

## 📞 Support Information

### Documentation
- **README.md** - Project overview
- **API_REFERENCE.md** - API documentation
- **TROUBLESHOOTING.md** - Common issues

### Contact
- **Author:** Vincent Onwuli
- **Email:** vinceonwuli7@gmail.com
- **GitHub:** [@Vinceszn](https://github.com/Vinceszn)

---

**🎯 You're now ready to use School OS for offline school management!**

Remember to:
- Change default passwords
- Set up regular backups
- Train users on the system
- Keep the software updated
