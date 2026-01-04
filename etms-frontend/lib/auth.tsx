"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

export interface User {
    id: string
    username: string
    email: string
    role: string
    token: string
    name?: string
    avatar?: string
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
    if (typeof window !== "undefined") {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user))
        } else {
            localStorage.removeItem("user")
        }
    }
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
        const user = localStorage.getItem("user")
        return user ? JSON.parse(user) : null
    }
    return null
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
        const storedUser = getCurrentUser()
        if (storedUser) {
            setUser(storedUser)
        }
        setLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const user = await authenticateUser(email, password)
            if (user) {
                setUser(user)
                setCurrentUser(user)
                return true
            }
            return false
        } catch (error) {
            console.error("Login failed", error)
            return false
        }
    }

    const logout = () => {
        setUser(null)
        setCurrentUser(null)
        router.push("/login")
    }

    // Prevent hydration mismatch
    if (!mounted) return null

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
