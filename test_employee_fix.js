const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

async function testEmployeeFlow() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Get Departments to use a valid ID
        console.log('Fetching departments...');
        const deptRes = await axios.get(`${API_URL}/departments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const departments = deptRes.data.data.departments;
        if (departments.length === 0) {
            console.error('No departments found. Please create one first.');
            return;
        }
        const departmentId = departments[0]._id;
        console.log(`Using department ID: ${departmentId}`);

        // 3. Create Employee
        console.log('Creating employee...');
        const newEmployee = {
            firstName: 'Test',
            lastName: 'User',
            email: `test.user.${Date.now()}@example.com`,
            phone: '1234567890',
            department: departmentId,
            position: 'Developer',
            salary: 80000,
            hireDate: new Date().toISOString(),
            status: 'active',
            address: {
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                country: 'Testland'
            },
            emergencyContact: {
                name: 'Emergency Contact',
                relationship: 'Friend',
                phone: '0987654321'
            },
            bankDetails: {
                accountNumber: '123456789',
                bankName: 'Test Bank',
                routingNumber: '987654321'
            },
            workSchedule: {
                startTime: '09:00',
                endTime: '17:00',
                workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            }
        };

        const createRes = await axios.post(`${API_URL}/employees`, newEmployee, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Employee created successfully:', createRes.data.data.employee.employeeId);

        // 4. Get Employees and verify population
        console.log('Fetching employees...');
        const getRes = await axios.get(`${API_URL}/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const employees = getRes.data.data.employees;
        const createdEmployee = employees.find(e => e._id === createRes.data.data.employee._id);

        if (createdEmployee) {
            console.log('Verifying population...');
            if (typeof createdEmployee.department === 'object' && createdEmployee.department.name) {
                console.log('✅ Department populated correctly:', createdEmployee.department.name);
            } else {
                console.error('❌ Department NOT populated correctly:', createdEmployee.department);
            }
        } else {
            console.error('❌ Created employee not found in list');
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testEmployeeFlow();
