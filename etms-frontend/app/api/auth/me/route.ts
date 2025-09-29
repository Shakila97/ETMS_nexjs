import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Employee from "@/models/Employee"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (user instanceof NextResponse) {
      return user // Return the error response
    }

    await dbConnect()

    // Get full user data
    const userData = await User.findById(user.userId).select("-password")
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get employee data if exists
    let employee = null
    if (userData.employeeId) {
      employee = await Employee.findById(userData.employeeId)
    }

    const responseData = {
      id: userData._id,
      email: userData.email,
      role: userData.role,
      isActive: userData.isActive,
      lastLogin: userData.lastLogin,
      employee: employee
        ? {
            id: employee._id,
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            department: employee.department,
            position: employee.position,
            avatar: employee.avatar,
            phone: employee.phone,
            hireDate: employee.hireDate,
            status: employee.status,
          }
        : null,
    }

    return NextResponse.json({ user: responseData })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
