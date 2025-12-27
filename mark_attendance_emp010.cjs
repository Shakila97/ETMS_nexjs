const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Common test employee credentials based on test scripts
const TEST_CREDENTIALS = [
    { email: 'test.employee009@example.com', password: 'Password@123' },
    { email: 'attendance.1732874000000@example.com', password: 'Password@123' },
    { email: 'attendance.1732873000000@example.com', password: 'Password@123' },
];

async function markAttendanceForEMP010() {
    try {
        console.log('🔍 Attempting to login as EMP010...\n');

        let userToken = null;
        let userEmail = null;

        // Try each possible credential
        for (const cred of TEST_CREDENTIALS) {
            try {
                console.log(`Trying email: ${cred.email}`);
                const loginRes = await axios.post(`${API_URL}/auth/login`, {
                    email: cred.email,
                    password: cred.password
                });

                // Check if this user is EMP010
                const meRes = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${loginRes.data.token}` }
                });

                if (meRes.data.data.user.employee?.employeeId === 'EMP010') {
                    userToken = loginRes.data.token;
                    userEmail = cred.email;
                    console.log('✅ Found EMP010! Email:', userEmail);
                    break;
                }
            } catch (error) {
                // Continue to next credential
                continue;
            }
        }

        if (!userToken) {
            console.log('\n❌ Could not find EMP010 user credentials.');
            console.log('💡 Please provide the email and password for EMP010.');
            console.log('\nAlternatively, you can:');
            console.log('1. Login to the frontend with EMP010 credentials');
            console.log('2. Click the "Check In" button');
            console.log('3. Or run: node test_attendance_full_flow.js to create a new test employee');
            return;
        }

        // Check today's attendance status
        console.log('\n📅 Checking today\'s attendance status...');
        const todayRes = await axios.get(`${API_URL}/attendance/today`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (todayRes.data.data.attendance?.checkIn?.time) {
            console.log('⚠️  Already checked in today at:', new Date(todayRes.data.data.attendance.checkIn.time).toLocaleTimeString());

            if (todayRes.data.data.attendance?.checkOut?.time) {
                console.log('⚠️  Already checked out today at:', new Date(todayRes.data.data.attendance.checkOut.time).toLocaleTimeString());
                console.log('✅ Attendance already marked for today!');
            } else {
                console.log('\n💡 Performing check-out...');
                const checkOutRes = await axios.post(`${API_URL}/attendance/check-out`, {
                    method: 'manual',
                    address: 'Script - Web Interface',
                    latitude: 0,
                    longitude: 0
                }, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                console.log('✅ Check-out successful!');
                console.log('⏱️  Total hours:', checkOutRes.data.data.attendance.totalHours);
            }
        } else {
            // Perform check-in
            console.log('✅ No check-in found for today. Performing check-in...');
            const checkInRes = await axios.post(`${API_URL}/attendance/check-in`, {
                method: 'manual',
                address: 'Script - Web Interface',
                latitude: 0,
                longitude: 0
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log('✅ Check-in successful at:', new Date(checkInRes.data.data.attendance.checkIn.time).toLocaleTimeString());
            console.log('💡 You can now check-out by running this script again.');
        }

        // Fetch all attendance records to verify
        console.log('\n📊 Fetching attendance records...');
        const attendanceRes = await axios.get(`${API_URL}/attendance`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        const todayDate = new Date().toISOString().split('T')[0];
        const todayRecords = attendanceRes.data.data.attendance.filter(record =>
            record.date.startsWith(todayDate)
        );

        console.log(`\n✅ Found ${todayRecords.length} attendance record(s) for today:`);
        todayRecords.forEach(record => {
            console.log(`   - ${record.employee.firstName} ${record.employee.lastName} (${record.employee.employeeId})`);
            console.log(`     Check-in: ${record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : 'N/A'}`);
            console.log(`     Check-out: ${record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : 'N/A'}`);
            console.log(`     Status: ${record.status}`);
        });

        console.log('\n🎉 Attendance marking completed successfully!');
        console.log('💡 Refresh your frontend (change date filter to "Today") to see the updated attendance records.');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. The backend server is running on port 5000');
        console.error('   2. EMP010 user exists in the database');
        console.error('   3. The user credentials are correct');
    }
}

markAttendanceForEMP010();
