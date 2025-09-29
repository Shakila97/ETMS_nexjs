import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Task from "@/models/Task"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/tasks - Get tasks with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const assignedTo = searchParams.get("assignedTo")
    const assignedBy = searchParams.get("assignedBy")
    const project = searchParams.get("project")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Build filter
    const filter: any = {}

    // Role-based filtering
    if (user.role === "employee") {
      filter.assignedTo = user.employeeId
    } else if (user.role === "manager" && user.employeeId) {
      // Managers can see tasks assigned to their direct reports and tasks they assigned
      const directReports = await Employee.find({ manager: user.employeeId }).select("_id")
      const reportIds = directReports.map((emp) => emp._id)
      reportIds.push(user.employeeId)

      filter.$or = [{ assignedTo: { $in: reportIds } }, { assignedBy: user.employeeId }]
    }

    // Apply additional filters
    if (assignedTo && (user.role === "admin" || user.role === "hr_manager")) {
      filter.assignedTo = assignedTo
    }

    if (assignedBy) {
      filter.assignedBy = assignedBy
    }

    if (project) {
      filter.project = { $regex: project, $options: "i" }
    }

    if (status) {
      filter.status = status
    }

    if (priority) {
      filter.priority = priority
    }

    if (startDate || endDate) {
      filter.dueDate = {}
      if (startDate) filter.dueDate.$gte = new Date(startDate)
      if (endDate) filter.dueDate.$lte = new Date(endDate)
    }

    // Execute query
    const skip = (page - 1) * limit

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo", "firstName lastName employeeId department position avatar")
        .populate("assignedBy", "firstName lastName employeeId")
        .populate("comments.author", "firstName lastName employeeId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ])

    // Get summary statistics
    const summaryStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalEstimatedHours: { $sum: "$estimatedHours" },
          totalActualHours: { $sum: "$actualHours" },
        },
      },
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: summaryStats,
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const taskData = await request.json()

    // Validate required fields
    const requiredFields = ["title", "description", "assignedTo", "startDate", "dueDate", "estimatedHours"]
    for (const field of requiredFields) {
      if (!taskData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate dates
    const startDate = new Date(taskData.startDate)
    const dueDate = new Date(taskData.dueDate)

    if (startDate >= dueDate) {
      return NextResponse.json({ error: "Due date must be after start date" }, { status: 400 })
    }

    // Ensure assignedTo is an array
    if (!Array.isArray(taskData.assignedTo)) {
      taskData.assignedTo = [taskData.assignedTo]
    }

    // Validate assigned employees exist
    const assignedEmployees = await Employee.find({
      _id: { $in: taskData.assignedTo },
    })

    if (assignedEmployees.length !== taskData.assignedTo.length) {
      return NextResponse.json({ error: "One or more assigned employees not found" }, { status: 400 })
    }

    // Create task
    const task = new Task({
      ...taskData,
      assignedBy: user.employeeId,
    })

    await task.save()

    // Populate data for response
    await task.populate("assignedTo", "firstName lastName employeeId department position")
    await task.populate("assignedBy", "firstName lastName employeeId")

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
