const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI ||
    "mongodb+srv://shakilasandun_db_user:hPKhSIyVvYSCNr6X@cluster0.ovmfsbu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkUsers() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        // Define User schema (minimal version)
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model("User", userSchema);

        // Get all users
        const users = await User.find({}).select("username email role isActive");

        console.log(`📊 Found ${users.length} user(s) in the database:\n`);

        if (users.length === 0) {
            console.log("❌ No users found in the database!");
            console.log("\n💡 You need to create a user first. Options:");
            console.log("1. Use the registration endpoint");
            console.log("2. Create a user directly in the database");
            console.log("3. Use a seed script if available");
        } else {
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.username || 'N/A'}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
                console.log("");
            });

            console.log("\n💡 To login, use one of the emails above with the correct password.");
            console.log("If you don't know the password, you may need to:");
            console.log("1. Reset it through a password reset flow");
            console.log("2. Update it directly in the database");
            console.log("3. Create a new admin user");
        }

        await mongoose.connection.close();
        console.log("\n✅ Database connection closed");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

checkUsers();
