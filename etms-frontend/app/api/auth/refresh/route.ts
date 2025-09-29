import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Employee from "@/models/Employee"
import { getCurrentUser, signToken } from "@/lib/jwt"
import { createAuthResponse } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    await dbConnect()

    // Verify user still exists and is active
    const user = await User.findById(currentUser.userId)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 401 })
    }

    // Get employee data if exists
    let employee = null
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId)
    }

    // Create new JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: employee?._id.toString(),
    })

    // Return refreshed user data and token
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
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
