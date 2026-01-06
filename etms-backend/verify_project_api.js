const fetch = global.fetch || require('node-fetch'); // Fallback if needed, though usually available in modern Node

const API_URL = "http://localhost:5000/api";
const ADMIN_EMAIL = "newadmin@example.com";
const ADMIN_PASSWORD = "Admin@123";

async function verify() {
    console.log("🔍 Starting Verification...");

    // 1. Login
    console.log("\n1️⃣  Logging in...");
    let token = "";
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error("❌ Login failed:", loginData.message);
            console.log("⚠️  Please ensure the admin user exists. You might need to run 'node create_new_admin.cjs'");
            return;
        }
        token = loginData.data.token;
        console.log("✅ Login successful");
    } catch (e) {
        console.error("❌ Login request failed:", e.message);
        return;
    }

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    // 2. Get an Employee (Manager)
    console.log("\n2️⃣  Fetching Employees...");
    let managerId = "";
    try {
        const empRes = await fetch(`${API_URL}/employees`, { headers });
        const empData = await empRes.json();
        console.log("DEBUG: Employee Fetch Response:", JSON.stringify(empData, null, 2));

        if (!empData.success || empData.data.employees.length === 0) {
            console.log("⚠️  No employees found. Creating one...");
            // Create an employee
            const newEmpPayload = {
                firstName: "Test",
                lastName: "Manager",
                email: `manager${Date.now()}@example.com`,
                department: "65e5d5d5d5d5d5d5d5d5d5d5", // Dummy ID, might fail if validate department exists.
                // Actually, I need a valid department ID. Let's try to fetch departments first or just skip manager validation if possible?
                // Backend validates department existence.
                // So I need a department.
            };

            // Let's fetch departments first
            const depRes = await fetch(`${API_URL}/departments`, { headers });
            const depData = await depRes.json();
            let departmentId = "";

            if (depData.success && depData.data.departments.length > 0) {
                departmentId = depData.data.departments[0]._id;
            } else {
                // Create department
                const newDepRes = await fetch(`${API_URL}/departments`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ name: "Test Dept " + Date.now(), description: "Test" })
                });
                const newDepData = await newDepRes.json();
                if (newDepData.success) {
                    departmentId = newDepData.data.department._id;
                } else {
                    console.error("❌ Failed to create department for employee creation.");
                    return;
                }
            }

            const createEmpRes = await fetch(`${API_URL}/employees`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    firstName: "Test",
                    lastName: "Manager",
                    email: `manager${Date.now()}@example.com`,
                    department: departmentId,
                    position: "Manager",
                    hireDate: new Date(),
                    salary: 50000
                })
            });
            const createEmpData = await createEmpRes.json();
            if (createEmpData.success) {
                managerId = createEmpData.data.employee._id;
                console.log(`✅ Created and using employee: ${createEmpData.data.employee.firstName} (${managerId})`);
            } else {
                console.error("❌ Failed to create employee:", createEmpData.message);
                return;
            }
        } else {
            managerId = empData.data.employees[0]._id;
            console.log(`✅ Found employee: ${empData.data.employees[0].firstName} (${managerId})`);
        }
    } catch (e) {
        console.error("❌ Fetch employees failed:", e.message);
        return;
    }

    // 3. Create Project
    console.log("\n3️⃣  Creating Project...");
    let projectId = "";
    const projectPayload = {
        name: "Test Project " + Date.now(),
        description: "Test Description",
        manager: managerId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // +1 day
        status: "planning"
    };

    try {
        const projRes = await fetch(`${API_URL}/projects`, {
            method: "POST",
            headers,
            body: JSON.stringify(projectPayload)
        });
        const projData = await projRes.json();

        if (!projData.success) {
            console.error("❌ Create project failed:", projData.message);
            return;
        }
        projectId = projData.data.project._id;
        console.log(`✅ Project Created: ${projData.data.project.name} (${projectId})`);
    } catch (e) {
        console.error("❌ Create project request failed:", e.message);
        return;
    }

    // 4. Create Task
    console.log("\n4️⃣  Creating Task linked to Project...");
    let taskId = "";
    const taskPayload = {
        title: "Test Task " + Date.now(),
        description: "Test Task Description",
        assignedTo: managerId, // Assign to same person for simplicity
        priority: "high",
        dueDate: new Date(Date.now() + 86400000),
        project: projectId
    };

    try {
        const taskRes = await fetch(`${API_URL}/tasks`, {
            method: "POST",
            headers,
            body: JSON.stringify(taskPayload)
        });
        const taskData = await taskRes.json();

        if (!taskData.success) {
            console.error("❌ Create task failed:", taskData.message);
            return;
        }
        taskId = taskData.data.task._id;
        console.log(`✅ Task Created: ${taskData.data.task.title} (${taskId})`);

        if (taskData.data.task.project === projectId || (taskData.data.task.project && taskData.data.task.project._id === projectId)) {
            console.log("✅ Task correctly linked to Project ID in response");
        } else {
            console.warn("⚠️  Task response project ID mismatch or missing");
            console.log("Response Project:", taskData.data.task.project);
        }

    } catch (e) {
        console.error("❌ Create task request failed:", e.message);
        return;
    }

    // 5. Verify Task Fetch (Populated)
    console.log("\n5️⃣  Fetching Task to verify Population...");
    try {
        const getTaskRes = await fetch(`${API_URL}/tasks/${taskId}`, { headers });
        const getTaskData = await getTaskRes.json();

        if (!getTaskData.success) {
            console.error("❌ Get task failed:", getTaskData.message);
            return;
        }

        const fetchedTask = getTaskData.data.task;
        if (fetchedTask.project && fetchedTask.project._id === projectId && fetchedTask.project.name === projectPayload.name) {
            console.log("✅ Task fetched and Project is correctly populated!");
            console.log(`   Project Name: ${fetchedTask.project.name}`);
        } else {
            console.error("❌ Project population verification failed.");
            console.log("Fetched Project:", fetchedTask.project);
        }

    } catch (e) {
        console.error("❌ Get task request failed:", e.message);
    }

    console.log("\n🎉 Verification Complete!");
}

verify();
