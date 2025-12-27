# 401 Unauthorized Error - Solution Guide

## Problem
You're getting 401 errors because the API endpoints require authentication, but you're not logged in.

## Quick Solution

### Step 1: Log in to the Frontend

1. **Open your frontend**: http://localhost:3000
2. **Find the login page** (usually at the root or `/login`)
3. **Use one of these admin accounts**:
   - Email: `admin@example.com`
   - Email: `adminabc@company.com`
   - Email: `adminshakila@example.com`
   
   **Note**: You'll need to know the password for these accounts. If you created them during testing, try common passwords like:
   - `admin123`
   - `password123`
   - `Password@123`

### Step 2: If You Don't Know the Password

Create a new admin user with a known password:

```bash
# Run this in the backend directory
node create_new_admin.cjs
```

Then use the credentials shown to log in.

---

## Why This Happens

1. **Backend Protection**: Your API routes are protected:
   ```javascript
   // routes/employees.js
   router.get("/", ...adminOrManager, async (req, res) => { ... })
   ```

2. **Authentication Required**: The `adminOrManager` middleware requires:
   - A valid JWT token in the `Authorization` header
   - The user role to be either "admin" or "manager"

3. **Frontend Token Management**: The axios interceptor automatically adds the token:
   ```javascript
   // lib/axios.ts
   const user = JSON.parse(localStorage.getItem("user"));
   config.headers.Authorization = `Bearer ${user.token}`;
   ```

4. **No Token = 401**: If you're not logged in, there's no token in localStorage, so the backend returns 401.

---

## Alternative: Temporary Testing Without Auth

If you want to test the endpoints without logging in (NOT recommended for production):

### Option A: Use Postman/Thunder Client
1. First, get a token by logging in via the `/api/auth/login` endpoint
2. Copy the token
3. Add it to your requests:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

### Option B: Temporarily Disable Auth (Development Only)
**WARNING**: Only do this in development, never in production!

1. Comment out the auth middleware in the routes:
   ```javascript
   // routes/employees.js
   // router.get("/", ...adminOrManager, async (req, res) => {
   router.get("/", async (req, res) => {
   ```

2. Restart the backend server

---

## Checking Your Login Status

Run this in your browser console (F12 → Console):

```javascript
const user = JSON.parse(localStorage.getItem("user"));
if (user && user.token) {
  console.log("✅ Logged in as:", user.email, "(" + user.role + ")");
  console.log("Token:", user.token);
} else {
  console.log("❌ Not logged in");
}
```

---

## Next Steps

1. ✅ Log in through the frontend
2. ✅ Verify you can see the departments and employees
3. ✅ If still having issues, check the browser console for errors
