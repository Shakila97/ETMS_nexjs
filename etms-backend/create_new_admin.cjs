const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI ||
    "mongodb+srv://shakilasandun_db_user:hPKhSIyVvYSCNr6X@cluster0.ovmfsbu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function createNewAdmin() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        // Define User schema
        const userSchema = new mongoose.Schema({
            username: String,
            email: String,
            password: String,
            role: String,
            isActive: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now }
        });

        const User = mongoose.model("User", userSchema);

        // Create new admin credentials
        const adminEmail = "newadmin@example.com";
        const adminPassword = "Admin@123";
        const adminUsername = "New Admin";

        // Check if user already exists
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            console.log("ℹ️  User already exists with this email.");
            console.log("\n🔑 Login Credentials:");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`Email:    ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("\n💡 Use these credentials to log in at http://localhost:3000");
        } else {
            // Hash password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Create new admin user
            const newAdmin = new User({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                isActive: true
            });

            await newAdmin.save();

            console.log("✅ New admin user created successfully!\n");
            console.log("🔑 Login Credentials:");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`Email:    ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("\n💡 Steps to use:");
            console.log("1. Open http://localhost:3000 in your browser");
            console.log("2. Go to the login page");
            console.log("3. Enter the credentials above");
            console.log("4. You should now have access to all features!");
        }

        await mongoose.connection.close();
        console.log("\n✅ Database connection closed");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

createNewAdmin();
