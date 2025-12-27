const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

async function reproduceIssue() {
    try {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const adminToken = loginRes.data.token;
        console.log('Admin Login successful');

        // 2. Get Today's Attendance as Admin (who likely has no employee record)
        console.log('Fetching today\'s attendance as Admin...');
        try {
            const todayRes = await axios.get(`${API_URL}/attendance/today`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('Response received successfully:');
            console.log(JSON.stringify(todayRes.data, null, 2));
        } catch (error) {
            console.error('Request failed with status:', error.response ? error.response.status : error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }

    } catch (error) {
        console.error('Setup failed:', error.response ? error.response.data : error.message);
    }
}

reproduceIssue();
