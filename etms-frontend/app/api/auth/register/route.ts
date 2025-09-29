import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Employee from "@/models/Employee"
import { signToken } from "@/lib/jwt"
import { createAuthResponse } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { email, password, role = "employee", employeeData } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 409 })
    }

    let employee = null

    // Create employee record if employee data provided
    if (employeeData) {
      // Check if employee email already exists
      const existingEmployee = await Employee.findOne({ email: email.toLowerCase() })
      if (existingEmployee) {
        return NextResponse.json({ error: "Employee already exists with this email" }, { status: 409 })
      }

      employee = new Employee({
        ...employeeData,
        email: email.toLowerCase(),
      })
      await employee.save()
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      role,
      employeeId: employee?._id,
      isActive: true,
    })

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
    }

    return createAuthResponse({ user: userData, token }, token)
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
