import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Attendance from "@/models/Attendance"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/attendance/summary - Get attendance summary and analytics
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // week, month, quarter, year
    const employeeId = searchParams.get("employeeId")

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Build filter
    const filter: any = {
      date: { $gte: startDate, $lte: now },
    }

    if (employeeId) {
      filter.employeeId = employeeId
    }

    // Role-based filtering for managers
    if (user.role === "manager" && user.employeeId) {
      const directReports = await Employee.find({ manager: user.employeeId }).select("_id")
      const reportIds = directReports.map((emp) => emp._id)
      reportIds.push(user.employeeId)
      filter.employeeId = { $in: reportIds }
    }

    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalHours: { $sum: "$workingHours" },
          totalOvertime: { $sum: "$overtime" },
          avgHours: { $avg: "$workingHours" },
        },
      },
    ])

    // Get daily attendance trends
    const dailyTrends = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          },
          totalPresent: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
          totalLate: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
          },
          totalAbsent: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
          avgWorkingHours: { $avg: "$workingHours" },
          totalOvertime: { $sum: "$overtime" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ])

    // Get employee-wise summary
    const employeeSummary = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$employeeId",
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
          totalHours: { $sum: "$workingHours" },
          totalOvertime: { $sum: "$overtime" },
          avgHours: { $avg: "$workingHours" },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          employee: {
            id: "$employee._id",
            name: { $concat: ["$employee.firstName", " ", "$employee.lastName"] },
            employeeId: "$employee.employeeId",
            department: "$employee.department",
            position: "$employee.position",
          },
          totalDays: 1,
          presentDays: 1,
          lateDays: 1,
          absentDays: 1,
          totalHours: { $round: ["$totalHours", 2] },
          totalOvertime: { $round: ["$totalOvertime", 2] },
          avgHours: { $round: ["$avgHours", 2] },
          attendanceRate: {
            $round: [{ $multiply: [{ $divide: ["$presentDays", "$totalDays"] }, 100] }, 2],
          },
        },
      },
      { $sort: { "employee.name": 1 } },
    ])

    return NextResponse.json({
      period,
      dateRange: { startDate, endDate: now },
      statistics: attendanceStats,
      dailyTrends,
      employeeSummary,
    })
  } catch (error) {
    console.error("Get attendance summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
