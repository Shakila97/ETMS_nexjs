import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Leave from "@/models/Leave"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/leave/balance - Get leave balance for employees
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId") || user.employeeId
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    // Check permissions
    if (user.role === "employee" && employeeId !== user.employeeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get employee data
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Calculate leave entitlements based on tenure and company policy
    const hireDate = new Date(employee.hireDate)
    const currentYear = new Date().getFullYear()
    const yearsOfService = currentYear - hireDate.getFullYear()

    // Standard leave entitlements (can be customized based on company policy)
    const leaveEntitlements = {
      annual: Math.min(20 + Math.floor(yearsOfService / 2), 30), // 20 days + 1 day per 2 years, max 30
      sick: 10,
      personal: 5,
      maternity: 90,
      paternity: 15,
      emergency: 3,
    }

    // Get used leave for the year
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31)

    const usedLeave = await Leave.aggregate([
      {
        $match: {
          employeeId: employee._id,
          status: "approved",
          startDate: { $gte: yearStart, $lte: yearEnd },
        },
      },
      {
        $group: {
          _id: "$type",
          totalDays: { $sum: "$days" },
        },
      },
    ])

    // Calculate remaining leave
    const leaveBalance = Object.keys(leaveEntitlements).map((type) => {
      const used = usedLeave.find((leave) => leave._id === type)?.totalDays || 0
      const entitled = leaveEntitlements[type as keyof typeof leaveEntitlements]

      return {
        type,
        entitled,
        used,
        remaining: entitled - used,
        percentage: Math.round((used / entitled) * 100),
      }
    })

    // Get pending leave requests
    const pendingLeave = await Leave.find({
      employeeId: employee._id,
      status: "pending",
      startDate: { $gte: yearStart, $lte: yearEnd },
    }).select("type days startDate endDate")

    return NextResponse.json({
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        hireDate: employee.hireDate,
        yearsOfService,
      },
      year,
      leaveBalance,
      pendingRequests: pendingLeave,
    })
  } catch (error) {
    console.error("Get leave balance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
