// test-api.js — API Testing Script for School OS
// Author: Vincent Onwuli
// Purpose: Test all API endpoints with sample data
// Version: 1.0.0

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test configuration
const testConfig = {
  admin: {
    username: 'admin',
    password: 'admin'
  }
};

/**
 * Test authentication and get token
 */
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testConfig.admin);
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Auth error:', error.response?.data?.error || error.message);
    return false;
  }
}

/**
 * Test students API
 */
async function testStudents() {
  console.log('\n👥 Testing Students API...');
  
  try {
    // Get all students
    const response = await axios.get(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ Retrieved ${response.data.data.length} students`);
      
      // Test getting a specific student
      if (response.data.data.length > 0) {
        const studentId = response.data.data[0].id;
        const studentResponse = await axios.get(`${BASE_URL}/students/${studentId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (studentResponse.data.success) {
          console.log(`✅ Retrieved student: ${studentResponse.data.data.first_name} ${studentResponse.data.data.last_name}`);
        }
      }
    } else {
      console.log('❌ Failed to get students:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Students API error:', error.response?.data?.error || error.message);
  }
}

/**
 * Test attendance API
 */
async function testAttendance() {
  console.log('\n📋 Testing Attendance API...');
  
  try {
    // Get attendance records
    const response = await axios.get(`${BASE_URL}/attendance`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ Retrieved ${response.data.data.length} attendance records`);
      
      // Test today's attendance
      const todayResponse = await axios.get(`${BASE_URL}/attendance/today`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (todayResponse.data.success) {
        console.log(`✅ Today's attendance: ${todayResponse.data.data.length} records`);
      }
    } else {
      console.log('❌ Failed to get attendance:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Attendance API error:', error.response?.data?.error || error.message);
  }
}

/**
 * Test reports API
 */
async function testReports() {
  console.log('\n📊 Testing Reports API...');
  
  try {
    // Get dashboard stats
    const response = await axios.get(`${BASE_URL}/reports/dashboard-stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Dashboard stats retrieved');
      console.log(`   Students: ${response.data.data.students.total}`);
      console.log(`   Classes: ${response.data.data.classes.total}`);
      console.log(`   Today's Attendance Rate: ${response.data.data.attendance.today.attendance_rate}%`);
    } else {
      console.log('❌ Failed to get dashboard stats:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Reports API error:', error.response?.data?.error || error.message);
  }
}

/**
 * Test settings API
 */
async function testSettings() {
  console.log('\n⚙️ Testing Settings API...');
  
  try {
    // Get all settings
    const response = await axios.get(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Settings retrieved');
      console.log(`   School Name: ${response.data.data.school_name?.value}`);
      console.log(`   Theme Color: ${response.data.data.theme_color?.value}`);
      
      // Test public branding endpoint (no auth required)
      const brandingResponse = await axios.get(`${BASE_URL}/settings/public/branding`);
      
      if (brandingResponse.data.success) {
        console.log('✅ Public branding retrieved');
        console.log(`   Public School Name: ${brandingResponse.data.data.school_name}`);
      }
    } else {
      console.log('❌ Failed to get settings:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Settings API error:', error.response?.data?.error || error.message);
  }
}

/**
 * Test creating a new student
 */
async function testCreateStudent() {
  console.log('\n➕ Testing Student Creation...');
  
  try {
    const newStudent = {
      student_id: 'TEST001',
      first_name: 'Test',
      last_name: 'Student',
      class_id: 1,
      parent_name: 'Test Parent',
      parent_phone: '555-TEST'
    };
    
    const response = await axios.post(`${BASE_URL}/students`, newStudent, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ Created student: ${response.data.data.first_name} ${response.data.data.last_name}`);
      console.log(`   Student ID: ${response.data.data.student_id}`);
      
      // Clean up - delete the test student
      await axios.patch(`${BASE_URL}/students/${response.data.data.id}/status`, 
        { status: 'inactive' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log('✅ Test student cleaned up');
    } else {
      console.log('❌ Failed to create student:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Student creation error:', error.response?.data?.error || error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting School OS API Tests...');
  console.log('=====================================');
  
  // Test authentication first
  const authSuccess = await testAuth();
  
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
    return;
  }
  
  // Run all other tests
  await testStudents();
  await testAttendance();
  await testReports();
  await testSettings();
  await testCreateStudent();
  
  console.log('\n🎉 All tests completed!');
  console.log('=====================================');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAuth,
  testStudents,
  testAttendance,
  testReports,
  testSettings,
  testCreateStudent
};
