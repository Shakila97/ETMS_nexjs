const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function createAdminUser() {
    try {
        console.log("🔧 Creating admin user...");

        // Register a new admin user
        const response = await axios.post(`${API_URL}/auth/register`, {
            username: "Admin User",
            email: "admin@example.com",
            password: "admin123",
            role: "admin"
        });

        if (response.data.success) {
            console.log("✅ Admin user created successfully!");
            console.log("User:", response.data.data.user);
            console.log("\n📋 Token:", response.data.data.token);
            console.log("\n🔑 Login Credentials:");
            console.log("Email: admin@example.com");
            console.log("Password: admin123");

            console.log("\n💡 To use this in your frontend:");
            console.log("1. Open http://localhost:3000 in your browser");
            console.log("2. Login with the credentials above");
            console.log("\nOR manually set the token:");
            console.log("1. Open Developer Tools (F12)");
            console.log("2. Go to Console");
            console.log("3. Run:");

            const userData = {
                id: response.data.data.user.id,
                username: response.data.data.user.username,
                email: response.data.data.user.email,
                role: response.data.data.user.role,
                token: response.data.data.token
            };

            console.log(`\nlocalStorage.setItem("user", '${JSON.stringify(userData)}')\n`);
            console.log("4. Refresh the page");
        } else {
            console.log("❌ Registration failed:", response.data.message);
        }
    } catch (error) {
        if (error.response?.data?.message?.includes("already exists")) {
            console.log("ℹ️  Admin user already exists. Trying to login...");

            // Try to login
            try {
                const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    email: "admin@example.com",
                    password: "admin123"
                });

                if (loginResponse.data.success) {
                    console.log("✅ Login successful!");
                    console.log("\n🔑 Login Credentials:");
                    console.log("Email: admin@example.com");
                    console.log("Password: admin123");

                    const userData = {
                        id: loginResponse.data.data.user.id,
                        username: loginResponse.data.data.user.username,
                        email: loginResponse.data.data.user.email,
                        role: loginResponse.data.data.user.role,
                        token: loginResponse.data.data.token
                    };

                    console.log("\n💡 To use this in your frontend:");
                    console.log("1. Open http://localhost:3000 in your browser");
                    console.log("2. Open Developer Tools (F12)");
                    console.log("3. Go to Console");
                    console.log("4. Run:");
                    console.log(`\nlocalStorage.setItem("user", '${JSON.stringify(userData)}')\n`);
                    console.log("5. Refresh the page");
                }
            } catch (loginError) {
                console.error("❌ Login also failed:", loginError.response?.data || loginError.message);
                console.log("\n💡 The admin user exists but the password might be different.");
                console.log("Try logging in through the frontend or check your database.");
            }
        } else {
            console.error("❌ Registration error:", error.response?.data || error.message);
        }
    }
}

createAdminUser();
