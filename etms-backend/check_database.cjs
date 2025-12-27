const mongoose = require("mongoose");
const User = require("./models/User");
const Employee = require("./models/Employee");
const Department = require("./models/Department");

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb+srv://shakilasandun_db_user:hPKhSIyVvYSCNr6X@cluster0.ovmfsbu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkDatabase() {
    try {
        console.log("🔍 Connecting to MongoDB...\n");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        // Check Users
        console.log("👥 Checking Users...");
        const users = await User.find({});
        console.log(`   Total users: ${users.length}`);
        if (users.length > 0) {
            users.forEach((user) => {
                console.log(`   - ${user.email} (${user.role}) - Active: ${user.isActive}`);
            });
        } else {
            console.log("   ⚠️  No users found in database!");
        }

        // Check Employees
        console.log("\n👔 Checking Employees...");
        const employees = await Employee.find({});
        console.log(`   Total employees: ${employees.length}`);
        if (employees.length > 0) {
            employees.slice(0, 5).forEach((emp) => {
                console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
            });
        } else {
            console.log("   ⚠️  No employees found in database!");
        }

        // Check Departments
        console.log("\n🏢 Checking Departments...");
        const departments = await Department.find({});
        console.log(`   Total departments: ${departments.length}`);
        if (departments.length > 0) {
            departments.forEach((dept) => {
                console.log(`   - ${dept.name}`);
            });
        } else {
            console.log("   ⚠️  No departments found in database!");
        }

        console.log("\n✅ Database check complete!");
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

checkDatabase();
