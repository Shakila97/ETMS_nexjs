const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'newadmin@example.com';
const ADMIN_PASSWORD = 'Admin@123';

async function verifyPayroll() {
    try {
        console.log('1. Authenticating as Admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);

        const token = loginData.data.token;
        console.log('✅ Authentication successful.');
        console.log('Token:', token.substring(0, 20) + '...');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Debug: Check /me
        console.log('\n1.5 Checking /auth/me ...');
        const meRes = await fetch(`${API_URL}/auth/me`, { headers });
        const meData = await meRes.json();
        if (!meRes.ok) {
            console.error('❌ /auth/me failed:', JSON.stringify(meData));
        } else {
            console.log('✅ /auth/me responded:', meData.data.user.email);
        }

        console.log('\n2. Fetching Employees...');
        const empRes = await fetch(`${API_URL}/employees`, { headers });
        const empData = await empRes.json();

        if (!empRes.ok) throw new Error(`Fetch employees failed: ${JSON.stringify(empData)}`);

        const employees = empData.data.employees;
        if (employees.length === 0) {
            console.error('❌ No employees found to calculate payroll for.');
            return;
        }
        const targetEmployee = employees[0];
        console.log(`✅ Found ${employees.length} employees. Targeting: ${targetEmployee.firstName} ${targetEmployee.lastName} (${targetEmployee.employeeId})`);

        console.log('\n3. Calculating Payroll...');
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        const calcRes = await fetch(`${API_URL}/payroll/calculate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                employeeId: targetEmployee._id,
                payPeriodStart: startOfMonth,
                payPeriodEnd: endOfMonth
            })
        });

        const calcData = await calcRes.json();
        console.log('✅ Calculate payroll response:', JSON.stringify(calcData, null, 2));

        console.log('\n4. Listing Payrolls...');
        const listRes = await fetch(`${API_URL}/payroll`, { headers });
        const listData = await listRes.json();

        if (!listRes.ok) throw new Error(`List payrolls failed: ${JSON.stringify(listData)}`);

        const payrolls = listData.data.payrolls;
        const createdPayroll = payrolls.find(p => p.employee._id === targetEmployee._id || p.employee === targetEmployee._id);

        if (createdPayroll) {
            console.log(`✅ Verified: Payroll record found for ${targetEmployee.firstName}. Net Salary: ${createdPayroll.netSalary}`);
        } else {
            console.log('⚠️ Warning: specific payroll record not found in the list (might be pagination or sorting), but list request succeeded.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    }
}

verifyPayroll();
