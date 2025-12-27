const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

async function testAttendanceFlow() {
    try {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const adminToken = loginRes.data.token;
        console.log('Admin Login successful');

        // 2. Get Departments
        console.log('Fetching departments...');
        const deptRes = await axios.get(`${API_URL}/departments`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const departments = deptRes.data.data.departments;
        if (departments.length === 0) {
            console.error('No departments found. Please create one first.');
            return;
        }
        const departmentId = departments[0]._id;

        // 3. Create Employee
        const timestamp = Date.now();
        console.log('Creating employee...');
        const newEmployee = {
            firstName: 'Attendance',
            lastName: 'Tester',
            email: `attendance.${timestamp}@example.com`,
            phone: '1234567890',
            department: departmentId,
            position: 'Tester',
            salary: 50000,
            hireDate: new Date().toISOString(),
            status: 'active',
            address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345', country: 'Testland' },
            emergencyContact: { name: 'Emergency', relationship: 'Friend', phone: '0987654321' },
            bankDetails: { accountNumber: '123456789', bankName: 'Test Bank', routingNumber: '987654321' },
            workSchedule: { startTime: '09:00', endTime: '17:00', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
        };

        const createEmpRes = await axios.post(`${API_URL}/employees`, newEmployee, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const employeeId = createEmpRes.data.data.employee._id;
        console.log('Employee created:', employeeId);

        // 4. Register User linked to Employee
        console.log('Registering user for employee...');
        const newUser = {
            username: `attendance_user_${timestamp}`,
            email: `attendance.${timestamp}@example.com`,
            password: 'Password@123',
            role: 'employee',
            employeeId: employeeId
        };

        await axios.post(`${API_URL}/auth/register`, newUser, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('User registered');

        // 5. Login as New User
        console.log('Logging in as New User...');
        const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: newUser.email,
            password: newUser.password
        });
        const userToken = userLoginRes.data.token;
        console.log('User Login successful');

        // 6. Check In
        console.log('Attempting Check-in...');
        const checkInRes = await axios.post(`${API_URL}/attendance/check-in`, {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Test Location',
            method: 'manual'
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log('Check-in successful:', checkInRes.data.message);

        // 7. Get Today's Attendance
        console.log('Fetching today\'s attendance...');
        const todayRes = await axios.get(`${API_URL}/attendance/today`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log('Today\'s attendance retrieved:', todayRes.data.data.attendance ? 'Found' : 'Not Found');

        // 8. Check Out
        console.log('Attempting Check-out...');
        const checkOutRes = await axios.post(`${API_URL}/attendance/check-out`, {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Test Location',
            method: 'manual'
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log('Check-out successful:', checkOutRes.data.message);
        console.log('Total Hours:', checkOutRes.data.data.attendance.totalHours);

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testAttendanceFlow();
