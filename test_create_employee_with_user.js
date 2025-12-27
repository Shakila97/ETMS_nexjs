const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123'; // Trying Admin@123 first, will fallback if needed

async function testCreateEmployeeWithUser() {
    try {
        console.log('🔐 Logging in as admin...');
        let adminToken;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            });
            adminToken = loginRes.data.token;
        } catch (e) {
            console.log('⚠️ Login failed with Admin@123, trying Password@123...');
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: ADMIN_EMAIL,
                password: 'Password@123'
            });
            adminToken = loginRes.data.token;
        }
        console.log('✅ Admin login successful');

        // Generate a unique email for the test
        const uniqueId = Date.now();
        const testEmail = `test.user.${uniqueId}@example.com`;
        const testEmployeeId = `EMP${uniqueId.toString().slice(-3)}`;

        // Get a valid department ID
        const deptRes = await axios.get(`${API_URL}/departments`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const departmentId = deptRes.data.data.departments[0]._id;

        console.log(`\n👤 Creating new employee with User Account...`);
        console.log(`   Email: ${testEmail}`);
        console.log(`   Employee ID: ${testEmployeeId}`);

        const createRes = await axios.post(`${API_URL}/employees`, {
            firstName: 'Test',
            lastName: 'User',
            email: testEmail,
            phone: '1234567890',
            address: {
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                country: 'Test Country'
            },
            department: departmentId,
            position: 'Developer',
            salary: 60000,
            hireDate: new Date().toISOString().split('T')[0],
            status: 'active',
            workSchedule: {
                startTime: '09:00',
                endTime: '17:00',
                workDays: ['Monday', 'Friday']
            },
            // The new fields we added
            createUserAccount: true,
            password: 'TestPassword@123'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('✅ Employee creation response:', createRes.data.message);

        // Verify User was created
        console.log('\n🔍 Verifying User Account creation...');
        // We can try to login as the new user
        const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: testEmail,
            password: 'TestPassword@123'
        });

        if (userLoginRes.data.success) {
            console.log('✅ Successfully logged in as the new user!');
            console.log('   User Role:', userLoginRes.data.user.role);
            console.log('   Linked Employee ID:', userLoginRes.data.user.employee.employeeId);
        } else {
            console.log('❌ Failed to login as the new user.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testCreateEmployeeWithUser();
