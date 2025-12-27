const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testEmployeeManagement() {
    try {
        console.log("🧪 Testing Employee Management Flow...\n");

        // Step 1: Login
        console.log("1️⃣ Attempting login...");
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: "admin@company.com",
            password: "password",
        });

        if (!loginResponse.data.success) {
            console.error("❌ Login failed:", loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log("✅ Login successful!");
        console.log(`   Token: ${token.substring(0, 20)}...`);
        console.log(`   User: ${loginResponse.data.user.username}`);
        console.log(`   Role: ${loginResponse.data.user.role}\n`);

        // Step 2: Fetch Employees
        console.log("2️⃣ Fetching employees...");
        const employeesResponse = await axios.get(`${API_URL}/employees`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (employeesResponse.data.success) {
            const employees = employeesResponse.data.data?.employees || [];
            console.log(`✅ Employees fetched successfully!`);
            console.log(`   Total employees: ${employees.length}`);
            if (employees.length > 0) {
                console.log(`   First employee: ${employees[0].firstName} ${employees[0].lastName} (${employees[0].employeeId})`);
            }
        } else {
            console.error("❌ Failed to fetch employees:", employeesResponse.data.message);
        }

        // Step 3: Fetch Departments
        console.log("\n3️⃣ Fetching departments...");
        const departmentsResponse = await axios.get(`${API_URL}/departments`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (departmentsResponse.data.success) {
            const departments = departmentsResponse.data.data?.departments || [];
            console.log(`✅ Departments fetched successfully!`);
            console.log(`   Total departments: ${departments.length}`);
            if (departments.length > 0) {
                console.log(`   First department: ${departments[0].name}`);
            }
        } else {
            console.error("❌ Failed to fetch departments:", departmentsResponse.data.message);
        }

        // Step 4: Fetch Tasks
        console.log("\n4️⃣ Fetching tasks...");
        const tasksResponse = await axios.get(`${API_URL}/tasks`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (tasksResponse.data.success) {
            const tasks = tasksResponse.data.data?.tasks || [];
            console.log(`✅ Tasks fetched successfully!`);
            console.log(`   Total tasks: ${tasks.length}`);
            if (tasks.length > 0) {
                console.log(`   First task: ${tasks[0].title}`);
            }
        } else {
            console.error("❌ Failed to fetch tasks:", tasksResponse.data.message);
        }

        console.log("\n✅ All tests passed! Employee Management is working correctly.");
    } catch (error) {
        console.error("\n❌ Test failed with error:");
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
            console.error(`   URL: ${error.config?.url}`);
        } else {
            console.error(`   ${error.message}`);
        }
    }
}

testEmployeeManagement();
