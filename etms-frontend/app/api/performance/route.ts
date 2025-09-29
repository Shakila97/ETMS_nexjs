import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Performance from "@/models/Performance"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/performance - Get performance reviews with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const reviewerId = searchParams.get("reviewerId")
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const year = searchParams.get("year")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Build filter
    const filter: any = {}

    // Role-based filtering
    if (user.role === "employee") {
      filter.employeeId = user.employeeId
    } else if (user.role === "manager" && user.employeeId) {
      // Managers can see reviews for their direct reports and reviews they conducted
      const directReports = await Employee.find({ manager: user.employeeId }).select("_id")
      const reportIds = directReports.map((emp) => emp._id)
      reportIds.push(user.employeeId)

      filter.$or = [{ employeeId: { $in: reportIds } }, { reviewerId: user.employeeId }]
    }

    // Apply additional filters
    if (employeeId && (user.role === "admin" || user.role === "hr_manager")) {
      filter.employeeId = employeeId
    }

    if (reviewerId) {
      filter.reviewerId = reviewerId
    }

    if (type) {
      filter.type = type
    }

    if (status) {
      filter.status = status
    }

    if (year) {
      const yearStart = new Date(Number.parseInt(year), 0, 1)
      const yearEnd = new Date(Number.parseInt(year), 11, 31)
      filter["period.startDate"] = { $gte: yearStart, $lte: yearEnd }
    }

    // Execute query
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      Performance.find(filter)
        .populate("employeeId", "firstName lastName employeeId department position avatar")
        .populate("reviewerId", "firstName lastName employeeId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Performance.countDocuments(filter),
    ])

    // Get summary statistics
    const summaryStats = await Performance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgRating: { $avg: "$overallRating" },
        },
      },
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: summaryStats,
    })
  } catch (error) {
    console.error("Get performance reviews error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/performance - Create new performance review
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const reviewData = await request.json()

    // Validate required fields
    const requiredFields = [
      "employeeId",
      "period",
      "type",
      "overallRating",
      "categories",
      "developmentPlan",
      "managerComments",
    ]
    for (const field of requiredFields) {
      if (!reviewData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate employee exists
    const employee = await Employee.findById(reviewData.employeeId)
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Check if manager is reviewing their direct report
    if (user.role === "manager" && employee.manager?.toString() !== user.employeeId) {
      return NextResponse.json({ error: "Can only review direct reports" }, { status: 403 })
    }

    // Check for existing review in the same period
    const existingReview = await Performance.findOne({
      employeeId: reviewData.employeeId,
      type: reviewData.type,
      "period.startDate": { $lte: new Date(reviewData.period.endDate) },
      "period.endDate": { $gte: new Date(reviewData.period.startDate) },
    })

    if (existingReview) {
      return NextResponse.json({ error: "Performance review already exists for this period" }, { status: 409 })
    }

    // Create performance review
    const review = new Performance({
      ...reviewData,
      reviewerId: user.employeeId,
    })

    await review.save()

    // Populate data for response
    await review.populate("employeeId", "firstName lastName employeeId department position")
    await review.populate("reviewerId", "firstName lastName employeeId")

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("Create performance review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
