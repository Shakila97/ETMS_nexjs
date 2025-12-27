const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testTaskFlow() {
    try {
        // 1. Register a temporary admin to get access to create employees
        const tempAdminId = Date.now();
        const tempAdminEmail = `temp.admin.${tempAdminId}@test.com`;
        const tempAdminPassword = 'TempPassword@123';

        console.log('👤 Registering temporary admin...');
        const tempRegisterRes = await axios.post(`${API_URL}/auth/register`, {
            username: `Temp Admin ${tempAdminId}`,
            email: tempAdminEmail,
            password: tempAdminPassword,
            role: 'admin'
        });
        const tempAdminToken = tempRegisterRes.data.data.token;
        const tempHeaders = { Authorization: `Bearer ${tempAdminToken}` };
        console.log('✅ Temporary admin registered');

        // 2. Get existing departments
        console.log('\n🏢 Fetching departments...');
        const deptRes = await axios.get(`${API_URL}/departments`, { headers: tempHeaders });
        const departments = deptRes.data.data.departments;
        if (departments.length === 0) throw new Error("No departments found");
        const departmentId = departments[0]._id;
        console.log(`   Using department: ${departments[0].name} (${departmentId})`);

        // 3. Create an Employee (who will be the task creator/assigner)
        console.log('\n👥 Creating an employee to be the Task Manager...');
        const empData = {
            firstName: "Task",
            lastName: "Manager",
            email: `task.manager.${tempAdminId}@test.com`,
            phone: "1234567890",
            address: "123 Test St",
            department: departmentId,
            position: "Manager",
            salary: 50000,
            hireDate: new Date().toISOString(),
            employeeId: `TM${tempAdminId}` // Ensure unique ID
        };
        const createEmpRes = await axios.post(`${API_URL}/employees`, empData, { headers: tempHeaders });
        const managerEmployeeId = createEmpRes.data.data.employee._id;
        console.log(`✅ Manager Employee created: ${managerEmployeeId}`);

        // 3. Register a User linked to this Employee with Admin role
        console.log('\n👤 Registering Admin User linked to this employee...');
        const adminEmail = `real.admin.${tempAdminId}@test.com`;
        const adminPassword = 'AdminPassword@123';
        const adminRegisterRes = await axios.post(`${API_URL}/auth/register`, {
            username: `Real Admin ${tempAdminId}`,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            employeeId: managerEmployeeId
        });
        const adminToken = adminRegisterRes.data.data.token;
        const headers = { Authorization: `Bearer ${adminToken}` };
        console.log('✅ Linked Admin User registered');

        // 4. Get Employees to assign task to
        console.log('\n👥 Fetching employees to assign task to...');
        const empRes = await axios.get(`${API_URL}/employees`, { headers });
        const employees = empRes.data.data.employees;
        const assigneeId = employees[0]._id;
        console.log(`   Assigning to: ${employees[0].firstName} ${employees[0].lastName} (${assigneeId})`);

        // 5. Create Task
        console.log('\n📝 Creating new task...');
        const newTask = {
            title: "Test Task via Script",
            description: "This is a test task created by the verification script",
            assignedTo: assigneeId,
            priority: "high",
            dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            estimatedHours: 5,
            tags: "test, script"
        };
        const createRes = await axios.post(`${API_URL}/tasks`, newTask, { headers });
        const taskId = createRes.data.data.task._id;
        console.log(`✅ Task created with ID: ${taskId}`);

        // 6. Verify Task Created
        console.log('\n🔍 Verifying task existence...');
        const getRes = await axios.get(`${API_URL}/tasks/${taskId}`, { headers });
        if (getRes.data.data.task.title !== newTask.title) throw new Error("Task title mismatch");
        console.log('✅ Task verified');

        // 7. Update Task
        console.log('\n✏️ Updating task...');
        const updateData = {
            title: "Updated Test Task Title",
            status: "in-progress"
        };
        await axios.put(`${API_URL}/tasks/${taskId}`, updateData, { headers });
        console.log('✅ Task updated');

        // 8. Verify Update
        const getUpdatedRes = await axios.get(`${API_URL}/tasks/${taskId}`, { headers });
        if (getUpdatedRes.data.data.task.title !== updateData.title) throw new Error("Task update failed");
        console.log('✅ Update verified');

        // 9. Delete Task
        console.log('\n🗑️ Deleting task...');
        await axios.delete(`${API_URL}/tasks/${taskId}`, { headers });
        console.log('✅ Task deleted');

        // 10. Verify Deletion
        try {
            await axios.get(`${API_URL}/tasks/${taskId}`, { headers });
            throw new Error("Task still exists after deletion");
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log('✅ Deletion verified (404 received)');
            } else {
                throw e;
            }
        }

        console.log('\n🎉 All Task Management tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testTaskFlow();
