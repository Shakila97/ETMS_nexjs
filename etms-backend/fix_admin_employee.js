const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI ||
    "mongodb+srv://shakilasandun_db_user:hPKhSIyVvYSCNr6X@cluster0.ovmfsbu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function fixAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const User = require("./models/User");
        const Employee = require("./models/Employee");
        // Note: I hope Employee model file is correct path relative to cwd (etms-backend)

        const adminEmail = "newadmin@example.com";
        const adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            console.error("❌ Admin user not found!");
            process.exit(1);
        }

        console.log(`Found admin user: ${adminUser.username}`);

        if (adminUser.employee) {
            console.log("ℹ️ Admin already has an employee record:", adminUser.employee);
            // Check if it exists
            const emp = await Employee.findById(adminUser.employee);
            if (emp) {
                console.log("Employee record exists.");
                process.exit(0);
            } else {
                console.log("Linked employee record missing in DB. Recreating...");
            }
        }

        // Create dummy employee
        const newEmployee = new Employee({
            employeeId: "ADMIN001",
            firstName: "Admin",
            lastName: "User",
            email: adminEmail,
            phone: "0000000000",
            address: "Admin Address",
            position: "Administrator",
            department: null, // access-control usually allows null
            salary: 0,
            hireDate: new Date(),
            status: "active",
            grossSalary: 0, // Validation might require this?
            // Add other required fields if necessary. 
            // Based on Employee.js (which I haven't fully seen schema for, but saw validtaion in routes)
        });

        // Let's check Employee schema requirements by creating it. 
        // Based on routes/employees.js, required fields seem to be inferred.
        // Let's try to save.
        try {
            await newEmployee.save();
            console.log("✅ Created new employee record:", newEmployee._id);
        } catch (err) {
            console.error("Failed to create employee:", err.message);
            // If department is required, we might need a dummy department.
            // Let's assume loose schema or handle error.
            if (err.message.includes("department")) {
                console.log("Creating dummy department...");
                const Department = require("./models/Department");
                let dept = await Department.findOne({ name: "Administration" });
                if (!dept) {
                    dept = new Department({ name: "Administration", description: "Admin Dept" });
                    await dept.save();
                }
                newEmployee.department = dept._id;
                await newEmployee.save();
                console.log("✅ Created new employee record with department:", newEmployee._id);
            } else {
                throw err;
            }
        }

        adminUser.employee = newEmployee._id;
        await adminUser.save();
        console.log("✅ Linked employee to admin user.");

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

fixAdmin();
