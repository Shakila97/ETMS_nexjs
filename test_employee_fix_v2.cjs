const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function request(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject({ statusCode: res.statusCode, data: parsed });
                    }
                } catch (e) {
                    reject({ statusCode: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testEmployeeFlow() {
    try {
        // 0. Register new admin user
        console.log('Registering new admin user...');
        const timestamp = Date.now();
        const adminUser = {
            username: `admin${timestamp}`,
            email: `admin${timestamp}@company.com`,
            password: 'Password123!',
            role: 'admin'
        };

        try {
            await request('POST', '/auth/register', adminUser);
            console.log('Admin registration successful');
        } catch (e) {
            console.log('Registration failed (maybe user exists), trying login...');
        }

        // 1. Login
        console.log('Logging in...');
        const loginRes = await request('POST', '/auth/login', {
            email: adminUser.email,
            password: adminUser.password
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Get Departments
        console.log('Fetching departments...');
        const deptRes = await request('GET', '/departments', null, token);
        const departments = deptRes.data.departments;

        let departmentId;
        if (departments.length === 0) {
            console.log('No departments found. Creating one...');
            const newDept = {
                name: `Test Dept ${timestamp}`,
                description: 'Test Department',
                manager: null, // Optional
                budget: 100000,
                location: 'Test Location'
            };
            const createDeptRes = await request('POST', '/departments', newDept, token);
            departmentId = createDeptRes.data.department._id;
            console.log('Department created:', departmentId);
        } else {
            departmentId = departments[0]._id;
            console.log(`Using existing department ID: ${departmentId}`);
        }

        // 3. Create Employee
        console.log('Creating employee...');
        const newEmployee = {
            firstName: 'Test',
            lastName: 'User',
            email: `test.user.${timestamp}@example.com`,
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

        const createRes = await request('POST', '/employees', newEmployee, token);
        console.log('Employee created successfully:', createRes.data.employee.employeeId);

        // 4. Get Employees and verify population
        console.log('Fetching employees...');
        const getRes = await request('GET', '/employees', null, token);
        const employees = getRes.data.employees;
        const createdEmployee = employees.find(e => e._id === createRes.data.employee._id);

        if (createdEmployee) {
            console.log('Verifying population...');
            if (typeof createdEmployee.department === 'object' && createdEmployee.department.name) {
                console.log('✅ Department populated correctly:', createdEmployee.department.name);
            } else {
                console.error('❌ Department NOT populated correctly:', createdEmployee.department);
                console.log('Actual value:', JSON.stringify(createdEmployee.department, null, 2));
            }
        } else {
            console.error('❌ Created employee not found in list');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testEmployeeFlow();
