import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Attendance from "@/models/Attendance"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/attendance - Get attendance records with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "30")

    // Build filter
    const filter: any = {}

    // Role-based filtering
    if (user.role === "employee") {
      filter.employeeId = user.employeeId
    } else if (user.role === "manager" && user.employeeId) {
      // Managers can see their direct reports' attendance
      const directReports = await Employee.find({ manager: user.employeeId }).select("_id")
      const reportIds = directReports.map((emp) => emp._id)
      reportIds.push(user.employeeId) // Include manager's own attendance
      filter.employeeId = { $in: reportIds }
    }

    // Apply additional filters
    if (employeeId && (user.role === "admin" || user.role === "hr_manager")) {
      filter.employeeId = employeeId
    }

    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    if (status) {
      filter.status = status
    }

    // Execute query
    const skip = (page - 1) * limit

    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(filter)
        .populate("employeeId", "firstName lastName employeeId department position avatar")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ])

    // Get summary statistics
    const summaryStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalHours: { $sum: "$workingHours" },
          totalOvertime: { $sum: "$overtime" },
        },
      },
    ])

    return NextResponse.json({
      attendance: attendanceRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: summaryStats,
    })
  } catch (error) {
    console.error("Get attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/attendance - Create attendance record (check-in/check-out)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { employeeId, action, location } = await request.json()

    // Employees can only mark their own attendance
    const targetEmployeeId = employeeId || user.employeeId
    if (user.role === "employee" && targetEmployeeId !== user.employeeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find or create today's attendance record
    let attendance = await Attendance.findOne({
      employeeId: targetEmployeeId,
      date: today,
    })

    if (!attendance) {
      attendance = new Attendance({
        employeeId: targetEmployeeId,
        date: today,
        status: "present",
      })
    }

    const now = new Date()

    // Handle different actions
    switch (action) {
      case "check_in":
        if (attendance.checkIn) {
          return NextResponse.json({ error: "Already checked in today" }, { status: 400 })
        }
        attendance.checkIn = now
        attendance.location = location

        // Determine if late (assuming 9 AM is standard start time)
        const standardStart = new Date(today)
        standardStart.setHours(9, 0, 0, 0)
        if (now > standardStart) {
          attendance.status = "late"
        }
        break

      case "check_out":
        if (!attendance.checkIn) {
          return NextResponse.json({ error: "Must check in before checking out" }, { status: 400 })
        }
        if (attendance.checkOut) {
          return NextResponse.json({ error: "Already checked out today" }, { status: 400 })
        }
        attendance.checkOut = now
        break

      case "break_start":
        if (!attendance.checkIn || attendance.checkOut) {
          return NextResponse.json({ error: "Invalid break start time" }, { status: 400 })
        }
        attendance.breakStart = now
        break

      case "break_end":
        if (!attendance.breakStart) {
          return NextResponse.json({ error: "Must start break before ending it" }, { status: 400 })
        }
        attendance.breakEnd = now
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await attendance.save()

    // Populate employee data
    await attendance.populate("employeeId", "firstName lastName employeeId")

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Create attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
