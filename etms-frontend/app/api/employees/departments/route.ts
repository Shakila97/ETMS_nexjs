import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/employees/departments - Get department statistics
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    // Get department statistics with employee counts and average salaries
    const departmentStats = await Employee.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$department",
          totalEmployees: { $sum: 1 },
          averageSalary: { $avg: "$salary" },
          positions: { $addToSet: "$position" },
          employees: {
            $push: {
              id: "$_id",
              name: { $concat: ["$firstName", " ", "$lastName"] },
              position: "$position",
              hireDate: "$hireDate",
            },
          },
        },
      },
      {
        $project: {
          department: "$_id",
          totalEmployees: 1,
          averageSalary: { $round: ["$averageSalary", 2] },
          uniquePositions: { $size: "$positions" },
          positions: 1,
          employees: 1,
          _id: 0,
        },
      },
      { $sort: { totalEmployees: -1 } },
    ])

    // Get overall statistics
    const overallStats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          activeEmployees: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactiveEmployees: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
          terminatedEmployees: {
            $sum: { $cond: [{ $eq: ["$status", "terminated"] }, 1, 0] },
          },
          averageSalary: { $avg: "$salary" },
          totalSalaryBudget: { $sum: "$salary" },
        },
      },
    ])

    return NextResponse.json({
      departments: departmentStats,
      overall: overallStats[0] || {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        terminatedEmployees: 0,
        averageSalary: 0,
        totalSalaryBudget: 0,
      },
    })
  } catch (error) {
    console.error("Get department stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
