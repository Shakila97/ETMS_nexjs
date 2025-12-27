const http = require('http');

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = `admin.test.${Date.now()}@company.com`;
const ADMIN_PASSWORD = 'Admin@123';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
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
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
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

async function runTest() {
    console.log('Starting Employee Update/Delete Test...');

    try {
        // 0. Register (just in case)
        console.log('\n0. Registering admin user (if needed)...');
        const registerRes = await makeRequest('POST', '/auth/register', {
            username: `admin_test_${Date.now()}`,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin'
        });

        if (registerRes.data.success) {
            console.log('Registration successful.');
        } else {
            console.log('Registration skipped/failed (likely already exists):', registerRes.data.message);
        }

        // 1. Login
        console.log('\n1. Logging in...');
        const loginRes = await makeRequest('POST', '/auth/login', {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        });

        if (!loginRes.data.success) {
            console.error('Login failed:', loginRes.data.message);
            return;
        }
        const token = loginRes.data.data.token;
        console.log('Login successful. Token:', token ? 'Received' : 'Missing');

        // 2. Create a temporary employee to test with
        console.log('\n2. Creating temporary employee...');

        // Get a department first
        const deptRes = await makeRequest('GET', '/departments', null, token);
        console.log('Departments response:', JSON.stringify(deptRes.data, null, 2));

        const departments = deptRes.data.data?.departments || deptRes.data.departments || [];
        const department = departments[0];
        if (!department) {
            console.error('No departments found. Cannot create employee.');
            return;
        }

        const newEmployee = {
            firstName: 'Test',
            lastName: 'UpdateDelete',
            email: `test.update.${Date.now()}@example.com`,
            phone: '1234567890',
            department: department._id,
            position: 'Tester',
            salary: 50000,
            hireDate: new Date().toISOString(),
            status: 'active',
            address: { street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '12345', country: 'Testland' },
            emergencyContact: { name: 'Emergency', relationship: 'None', phone: '911' },
            bankDetails: { accountNumber: '123', bankName: 'Test Bank', routingNumber: '123' },
            workSchedule: { startTime: '09:00', endTime: '17:00', workDays: ['Monday'] }
        };

        const createRes = await makeRequest('POST', '/employees', newEmployee, token);
        if (!createRes.data.success) {
            console.error('Create failed:', createRes.data);
            return;
        }
        const employeeId = createRes.data.data.employee._id;
        console.log(`Employee created: ${employeeId}`);

        // 3. Update the employee
        console.log('\n3. Testing Update (PUT)...');
        const updateData = {
            salary: 60000,
            position: 'Senior Tester'
        };
        const updateRes = await makeRequest('PUT', `/employees/${employeeId}`, updateData, token);

        if (updateRes.data.success && updateRes.data.data.employee.salary === 60000) {
            console.log('✅ Update successful. Salary updated to 60000.');
        } else {
            console.error('❌ Update failed:', updateRes.data);
        }

        // 4. Delete the employee
        console.log('\n4. Testing Delete (DELETE)...');
        const deleteRes = await makeRequest('DELETE', `/employees/${employeeId}`, null, token);

        if (deleteRes.data.success) {
            console.log('✅ Delete successful.');
        } else {
            console.error('❌ Delete failed:', deleteRes.data);
        }

        // 5. Verify Deletion (Soft Delete check)
        console.log('\n5. Verifying Deletion...');
        const verifyRes = await makeRequest('GET', `/employees/${employeeId}`, null, token);
        if (verifyRes.data.success) {
            if (verifyRes.data.data.employee.status === 'terminated') {
                console.log('✅ Employee status is "terminated" (Soft Delete confirmed).');
            } else {
                console.error('❌ Employee status is NOT terminated:', verifyRes.data.data.employee.status);
            }
        } else {
            console.error('❌ Could not fetch employee to verify status.');
        }

    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

runTest();
