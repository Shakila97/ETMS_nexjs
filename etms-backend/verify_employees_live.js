const api = require('./lib/axios').default; // Assuming this works in node if axios is mock-friendly or if I configure it manually
// Actually, better to use the backend script approach since I can't run frontend code directly in node easily without setup.
// I'll create a backend verification script that mimics what the frontend does.

const axios = require('axios');

async function verifyEmployees() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'newadmin@example.com',
            password: 'Admin@123'
        });
        const token = loginRes.data.data.token;
        console.log('Login successful');

        // 2. Fetch Employees
        const empRes = await axios.get('http://localhost:5000/api/employees?status=active&limit=100', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Employee Fetch Status:', empRes.status);
        console.log('Employee Count:', empRes.data.data.employees.length);
        console.log('First Employee:', empRes.data.data.employees[0] ? empRes.data.data.employees[0].firstName : 'None');

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

verifyEmployees();
