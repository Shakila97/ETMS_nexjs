// lib/auth.ts
import axios from "axios"

export interface User {
  id: string
  username: string
  email: string
  role: string
  token: string
  name?: string      // Add this
  avatar?: string    // Add this

}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Login user
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password })
    console.log("DEBUG: Login response", res.data)
    if (res.data.success) {
      const userData = res.data.data.user
      return {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        name: userData.name || userData.username || "",
        avatar: userData.avatar || "",
        token: res.data.data.token,
      }
    }
    return null
  } catch (err) {
    console.error("Login error:", err)
    return null
  }
}

// Save current user in localStorage
export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user))
  } else {
    localStorage.removeItem("user")
  }
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}
