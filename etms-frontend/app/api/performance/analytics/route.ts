import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Performance from "@/models/Performance"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/performance/analytics - Get performance analytics and trends
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const department = searchParams.get("department")

    // Build filter
    const filter: any = {
      status: "approved",
      "period.startDate": {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31),
      },
    }

    // Role-based filtering for managers
    if (user.role === "manager" && user.employeeId) {
      const directReports = await Employee.find({ manager: user.employeeId }).select("_id")
      const reportIds = directReports.map((emp) => emp._id)
      filter.employeeId = { $in: reportIds }
    }

    // Department filter
    if (department) {
      const deptEmployees = await Employee.find({ department }).select("_id")
      const deptIds = deptEmployees.map((emp) => emp._id)
      filter.employeeId = filter.employeeId
        ? { $in: filter.employeeId.$in.filter((id: any) => deptIds.some((deptId) => deptId.equals(id))) }
        : { $in: deptIds }
    }

    // Get performance trends by month
    const monthlyTrends = await Performance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            month: { $month: "$period.startDate" },
            year: { $year: "$period.startDate" },
          },
          avgRating: { $avg: "$overallRating" },
          reviewCount: { $sum: 1 },
          ratings: { $push: "$overallRating" },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          avgRating: { $round: ["$avgRating", 2] },
          reviewCount: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ])

    // Get department-wise performance
    const departmentPerformance = await Performance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee.department",
          avgRating: { $avg: "$overallRating" },
          reviewCount: { $sum: 1 },
          employeeCount: { $addToSet: "$employeeId" },
          topPerformers: {
            $push: {
              $cond: [
                { $gte: ["$overallRating", 4] },
                {
                  name: { $concat: ["$employee.firstName", " ", "$employee.lastName"] },
                  rating: "$overallRating",
                },
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          department: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          reviewCount: 1,
          employeeCount: { $size: "$employeeCount" },
          topPerformers: {
            $filter: {
              input: "$topPerformers",
              cond: { $ne: ["$$this", null] },
            },
          },
          _id: 0,
        },
      },
      { $sort: { avgRating: -1 } },
    ])

    // Get rating distribution
    const ratingDistribution = await Performance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$overallRating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get goal completion rates
    const goalAnalytics = await Performance.aggregate([
      { $match: filter },
      { $unwind: "$goals" },
      {
        $group: {
          _id: "$goals.status",
          count: { $sum: 1 },
          avgProgress: { $avg: "$goals.progress" },
        },
      },
    ])

    // Get category performance
    const categoryPerformance = await Performance.aggregate([
      { $match: filter },
      { $unwind: "$categories" },
      {
        $group: {
          _id: "$categories.name",
          avgRating: { $avg: "$categories.rating" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          count: 1,
          _id: 0,
        },
      },
      { $sort: { avgRating: -1 } },
    ])

    return NextResponse.json({
      year,
      monthlyTrends,
      departmentPerformance,
      ratingDistribution,
      goalAnalytics,
      categoryPerformance,
    })
  } catch (error) {
    console.error("Get performance analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
