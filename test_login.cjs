const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testLogin() {
    try {
        console.log("🔐 Testing login...");

        // Try to login with a test admin account
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: "admin@example.com",
            password: "admin123"
        });

        if (response.data.success) {
            console.log("✅ Login successful!");
            console.log("User:", response.data.data.user);
            console.log("\n📋 Token:", response.data.data.token);
            console.log("\n💡 To use this token in your frontend:");
            console.log("1. Open your browser's Developer Tools (F12)");
            console.log("2. Go to the Console tab");
            console.log("3. Run this command:");
            console.log(`\nlocalStorage.setItem("user", '${JSON.stringify(response.data.data)}')\n`);
            console.log("4. Refresh the page");
        } else {
            console.log("❌ Login failed:", response.data.message);
        }
    } catch (error) {
        console.error("❌ Login error:", error.response?.data || error.message);
        console.log("\n💡 This might mean:");
        console.log("1. No admin user exists in the database");
        console.log("2. The credentials are incorrect");
        console.log("\nYou may need to create an admin user first.");
    }
}

testLogin();
