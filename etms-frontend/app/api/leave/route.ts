import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Leave from "@/models/Leave"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/leave - Get leave requests with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Build filter
    const filter: any = {}

    // Role-based filtering
    if (user.role === "employee") {
      filter.employeeId = user.employeeId
    } else if (user.role === "manager" && user.employeeId) {
      // Managers can see their direct reports' leave requests
      const directReports = await Employee.find({ manager: user.employeeId }).select("_id")
      const reportIds = directReports.map((emp) => emp._id)
      reportIds.push(user.employeeId)
      filter.employeeId = { $in: reportIds }
    }

    // Apply additional filters
    if (employeeId && (user.role === "admin" || user.role === "hr_manager")) {
      filter.employeeId = employeeId
    }

    if (status) {
      filter.status = status
    }

    if (type) {
      filter.type = type
    }

    if (startDate || endDate) {
      filter.startDate = {}
      if (startDate) filter.startDate.$gte = new Date(startDate)
      if (endDate) filter.startDate.$lte = new Date(endDate)
    }

    // Execute query
    const skip = (page - 1) * limit

    const [leaveRequests, total] = await Promise.all([
      Leave.find(filter)
        .populate("employeeId", "firstName lastName employeeId department position avatar")
        .populate("approvedBy", "firstName lastName employeeId")
        .sort({ appliedDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Leave.countDocuments(filter),
    ])

    // Get summary statistics
    const summaryStats = await Leave.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDays: { $sum: "$days" },
        },
      },
    ])

    return NextResponse.json({
      leaveRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: summaryStats,
    })
  } catch (error) {
    console.error("Get leave requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/leave - Create new leave request
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const leaveData = await request.json()

    // Employees can only create leave requests for themselves
    const targetEmployeeId = leaveData.employeeId || user.employeeId
    if (user.role === "employee" && targetEmployeeId !== user.employeeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Validate required fields
    const requiredFields = ["type", "startDate", "endDate", "reason"]
    for (const field of requiredFields) {
      if (!leaveData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate dates
    const startDate = new Date(leaveData.startDate)
    const endDate = new Date(leaveData.endDate)

    if (startDate >= endDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
    }

    if (startDate < new Date()) {
      return NextResponse.json({ error: "Cannot apply for leave in the past" }, { status: 400 })
    }

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employeeId: targetEmployeeId,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    })

    if (overlappingLeave) {
      return NextResponse.json({ error: "Overlapping leave request already exists" }, { status: 409 })
    }

    // Create leave request
    const leave = new Leave({
      ...leaveData,
      employeeId: targetEmployeeId,
      appliedDate: new Date(),
    })

    await leave.save()

    // Populate employee data
    await leave.populate("employeeId", "firstName lastName employeeId department")

    return NextResponse.json({ leave }, { status: 201 })
  } catch (error) {
    console.error("Create leave request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
