import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Employee from "@/models/Employee"
import User from "@/models/User"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/employees/[id] - Get single employee
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const employee = await Employee.findById(params.id)
      .populate("manager", "firstName lastName employeeId position")
      .lean()

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Check permissions - employees can only view their own data
    if (user.role === "employee" && user.employeeId !== params.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Managers can only view their direct reports and themselves
    if (user.role === "manager" && user.employeeId !== params.id) {
      const isDirectReport = employee.manager?.toString() === user.employeeId
      if (!isDirectReport) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Get direct reports if user is viewing their own profile or has permission
    let directReports = []
    if (user.role !== "employee" || user.employeeId === params.id) {
      directReports = await Employee.find({ manager: params.id })
        .select("firstName lastName employeeId position department")
        .lean()
    }

    return NextResponse.json({
      employee: {
        ...employee,
        directReports,
      },
    })
  } catch (error) {
    console.error("Get employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    let updateData = await request.json()

    const employee = await Employee.findById(params.id)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === "employee" && user.employeeId !== params.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (user.role === "manager" && user.employeeId !== params.id) {
      const isDirectReport = employee.manager?.toString() === user.employeeId
      if (!isDirectReport) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Restrict what employees can update about themselves
    if (user.role === "employee") {
      const allowedFields = ["phone", "address", "emergencyContact", "skills"]
      const filteredData: any = {}
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field]
        }
      }
      updateData = filteredData
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== employee.email) {
      const existingEmployee = await Employee.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: params.id },
      })
      if (existingEmployee) {
        return NextResponse.json({ error: "Employee with this email already exists" }, { status: 409 })
      }
      updateData.email = updateData.email.toLowerCase()
    }

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("manager", "firstName lastName employeeId")

    return NextResponse.json({ employee: updatedEmployee })
  } catch (error) {
    console.error("Update employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/employees/[id] - Delete employee (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const employee = await Employee.findById(params.id)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Soft delete - change status to terminated
    employee.status = "terminated"
    await employee.save()

    // Also deactivate associated user account
    await User.findOneAndUpdate({ employeeId: params.id }, { isActive: false })

    return NextResponse.json({ message: "Employee terminated successfully" })
  } catch (error) {
    console.error("Delete employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
