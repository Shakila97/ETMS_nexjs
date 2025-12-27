const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function markAttendanceForEMP010() {
    try {
        console.log('🔍 Step 1: Finding EMP010 user credentials...');

        // First, login as admin to get employee details
        console.log('🔐 Logging in as admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@company.com',
            password: 'Admin@123'
        });
        const adminToken = adminLogin.data.token;
        console.log('✅ Admin login successful');

        // Get all employees to find EMP010
        console.log('🔍 Fetching employees...');
        const employeesRes = await axios.get(`${API_URL}/employees`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const emp010 = employeesRes.data.data.employees.find(emp => emp.employeeId === 'EMP010');

        if (!emp010) {
            console.log('❌ Employee EMP010 not found in the system');
            return;
        }

        console.log('✅ Found employee:', emp010.firstName, emp010.lastName);
        console.log('📧 Email:', emp010.email);

        // Try to login as this employee
        // The password is typically 'Password@123' for test employees
        console.log('\n🔐 Step 2: Logging in as EMP010...');
        let userToken;
        try {
            const userLogin = await axios.post(`${API_URL}/auth/login`, {
                email: emp010.email,
                password: 'Password@123'
            });
            userToken = userLogin.data.token;
            console.log('✅ Login successful for EMP010');
        } catch (error) {
            console.log('❌ Login failed. The password might be different.');
            console.log('💡 Try logging in manually with email:', emp010.email);
            console.log('💡 Common test passwords: Password@123, Admin@123');
            return;
        }

        // Check today's attendance status
        console.log('\n📅 Step 3: Checking today\'s attendance status...');
        const todayRes = await axios.get(`${API_URL}/attendance/today`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (todayRes.data.data.attendance?.checkIn?.time) {
            console.log('⚠️  Already checked in today at:', new Date(todayRes.data.data.attendance.checkIn.time).toLocaleTimeString());

            if (todayRes.data.data.attendance?.checkOut?.time) {
                console.log('⚠️  Already checked out today at:', new Date(todayRes.data.data.attendance.checkOut.time).toLocaleTimeString());
                console.log('✅ Attendance already marked for today!');
            } else {
                console.log('💡 Performing check-out...');
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
            console.log('💡 You can now check-out by running this script again, or wait and check-out later.');
        }

        // Fetch all attendance records to verify
        console.log('\n📊 Step 4: Fetching attendance records...');
        const attendanceRes = await axios.get(`${API_URL}/attendance`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        const todayDate = new Date().toISOString().split('T')[0];
        const todayRecords = attendanceRes.data.data.attendance.filter(record =>
            record.date.startsWith(todayDate)
        );

        console.log(`\n✅ Found ${todayRecords.length} attendance record(s) for today`);
        todayRecords.forEach(record => {
            console.log(`   - ${record.employee.firstName} ${record.employee.lastName} (${record.employee.employeeId})`);
            console.log(`     Check-in: ${record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : 'N/A'}`);
            console.log(`     Check-out: ${record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : 'N/A'}`);
            console.log(`     Status: ${record.status}`);
        });

        console.log('\n🎉 Attendance marking completed successfully!');
        console.log('💡 Refresh your frontend to see the updated attendance records.');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

markAttendanceForEMP010();
