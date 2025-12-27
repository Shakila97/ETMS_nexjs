const API_URL = 'http://localhost:5000/api';

async function testAttendanceFlow() {
    try {
        // Helper for fetch requests
        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const options = {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            };

            const res = await fetch(url, options);
            const data = await res.json();

            if (!res.ok) {
                // If login fails, we might want to handle it, but here we just throw
                throw new Error(data.message || res.statusText);
            }
            return data;
        };

        const timestamp = Date.now();
        const ADMIN_EMAIL = `admin.${timestamp}@test.com`;
        const ADMIN_PASSWORD = 'Password@123';

        // 1. Register new Admin
        console.log('Registering new Admin...');
        const adminUser = {
            username: `admin_${timestamp}`,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin'
        };

        // Try to register admin. If it fails (e.g. admin only), we might be stuck, 
        // but let's assume we can register in dev environment.
        let adminToken;
        try {
            const registerRes = await request(`${API_URL}/auth/register`, 'POST', adminUser);
            adminToken = registerRes.data.token;
            console.log('Admin registered and logged in');
        } catch (e) {
            console.log('Registration failed, trying login with default admin...');
            // Fallback to default if registration fails (maybe it's restricted)
            // But we already know default failed. 
            // Let's try to login with the new credentials just in case register returns 201 but no token?
            // The code shows register returns token.
            throw e;
        }

        // 2. Get Departments
        console.log('Fetching departments...');
        const deptRes = await request(`${API_URL}/departments`, 'GET', null, adminToken);
        let departments = deptRes.data.departments;
        let departmentId;

        if (departments.length === 0) {
            console.log('No departments found. Creating one...');
            const newDept = {
                name: `Test Dept ${timestamp}`,
                description: 'Test Department'
            };
            const createDeptRes = await request(`${API_URL}/departments`, 'POST', newDept, adminToken);
            departmentId = createDeptRes.data.department._id;
            console.log('Department created:', departmentId);
        } else {
            departmentId = departments[0]._id;
        }

        // 3. Create Employee
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

        const createEmpRes = await request(`${API_URL}/employees`, 'POST', newEmployee, adminToken);
        const employeeId = createEmpRes.data.employee._id;
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

        await request(`${API_URL}/auth/register`, 'POST', newUser, adminToken);
        console.log('User registered');

        // 5. Login as New User
        console.log('Logging in as New User...');
        const userLoginRes = await request(`${API_URL}/auth/login`, 'POST', {
            email: newUser.email,
            password: newUser.password
        });
        const userToken = userLoginRes.data.token;
        console.log('User Login successful');

        // 6. Check In
        console.log('Attempting Check-in...');
        const checkInRes = await request(`${API_URL}/attendance/check-in`, 'POST', {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Test Location',
            method: 'manual'
        }, userToken);
        console.log('Check-in successful:', checkInRes.message);

        // 7. Get Today's Attendance
        console.log('Fetching today\'s attendance...');
        const todayRes = await request(`${API_URL}/attendance/today`, 'GET', null, userToken);
        console.log('Today\'s attendance retrieved:', todayRes.data.attendance ? 'Found' : 'Not Found');

        // 8. Check Out
        console.log('Attempting Check-out...');
        const checkOutRes = await request(`${API_URL}/attendance/check-out`, 'POST', {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Test Location',
            method: 'manual'
        }, userToken);
        console.log('Check-out successful:', checkOutRes.message);
        console.log('Total Hours:', checkOutRes.data.attendance.totalHours);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAttendanceFlow();
