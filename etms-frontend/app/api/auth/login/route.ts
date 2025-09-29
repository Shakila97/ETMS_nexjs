import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Employee from "@/models/Employee"
import { signToken } from "@/lib/jwt"
import { createAuthResponse } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check password
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Get employee data if exists
    let employee = null
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId)
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Create JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: employee?._id.toString(),
    })

    // Return user data and token
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      employee: employee
        ? {
            id: employee._id,
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            department: employee.department,
            position: employee.position,
            avatar: employee.avatar,
          }
        : null,
      lastLogin: user.lastLogin,
    }

    return createAuthResponse({ user: userData, token }, token)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
