import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/employees - List all employees with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user // Return the error response
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const department = searchParams.get("department") || ""
    const status = searchParams.get("status") || ""
    const sortBy = searchParams.get("sortBy") || "firstName"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    // Build filter query
    const filter: any = {}

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ]
    }

    if (department) {
      filter.department = department
    }

    if (status) {
      filter.status = status
    }

    // If user is a manager, only show their direct reports and themselves
    if (user.role === "manager" && user.employeeId) {
      filter.$or = [{ manager: user.employeeId }, { _id: user.employeeId }]
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    // Execute query with pagination
    const skip = (page - 1) * limit

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate("manager", "firstName lastName employeeId")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
    ])

    // Get department statistics
    const departmentStats = await Employee.aggregate([
      { $match: filter },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get status statistics
    const statusStats = await Employee.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        departments: departmentStats,
        statuses: statusStats,
      },
    })
  } catch (error) {
    console.error("Get employees error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const employeeData = await request.json()

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email", "phone", "department", "position", "hireDate", "salary"]
    for (const field of requiredFields) {
      if (!employeeData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email: employeeData.email.toLowerCase() })
    if (existingEmployee) {
      return NextResponse.json({ error: "Employee with this email already exists" }, { status: 409 })
    }

    // Create employee
    const employee = new Employee({
      ...employeeData,
      email: employeeData.email.toLowerCase(),
    })

    await employee.save()

    // Populate manager data
    await employee.populate("manager", "firstName lastName employeeId")

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error("Create employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
