const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI ||
    "mongodb+srv://shakilasandun_db_user:hPKhSIyVvYSCNr6X@cluster0.ovmfsbu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Schemas (simplified for seeding)
        const DepartmentSchema = new mongoose.Schema({ name: String, description: String }, { timestamps: true });
        const EmployeeSchema = new mongoose.Schema({
            firstName: String, lastName: String, email: String,
            department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
            position: String, status: { type: String, default: 'active' },
            employeeId: String
        }, { strict: false }); // Strict false to allow other fields if schema is complex

        const Department = mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
        const Employee = mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);

        // 1. Create Department
        let dept = await Department.findOne({ name: "Seeded Dept" });
        if (!dept) {
            dept = await Department.create({ name: "Seeded Dept", description: "For Testing" });
            console.log("✅ Created Department:", dept.name);
        } else {
            console.log("ℹ️  Using existing Department:", dept.name);
        }

        // 2. Create Employee
        let emp = await Employee.findOne({ email: "seed_manager@example.com" });
        if (!emp) {
            emp = await Employee.create({
                firstName: "Seed",
                lastName: "Manager",
                email: "seed_manager@example.com",
                employeeId: "EMP_SEED",
                department: dept._id,
                position: "Manager",
                status: "active"
            });
            console.log("✅ Created Employee:", emp.firstName);
        } else {
            console.log("ℹ️  Using existing Employee:", emp.firstName);
        }

        console.log("🎉 Seeding complete.");
        process.exit(0);

    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

seed();
