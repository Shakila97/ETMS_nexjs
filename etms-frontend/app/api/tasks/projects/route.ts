import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Task from "@/models/Task"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/tasks/projects - Get project statistics and task summaries
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    // Build filter based on user role
    const filter: any = {}
    if (user.role === "manager" && user.employeeId) {
      filter.assignedBy = user.employeeId
    }

    // Get project statistics
    const projectStats = await Task.aggregate([
      { $match: filter },
      { $match: { project: { $exists: true, $ne: null, $ne: "" } } },
      {
        $group: {
          _id: "$project",
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          todoTasks: {
            $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] },
          },
          totalEstimatedHours: { $sum: "$estimatedHours" },
          totalActualHours: { $sum: "$actualHours" },
          avgPriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "low"] }, then: 1 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "high"] }, then: 3 },
                  { case: { $eq: ["$priority", "urgent"] }, then: 4 },
                ],
                default: 2,
              },
            },
          },
          tasks: {
            $push: {
              id: "$_id",
              title: "$title",
              status: "$status",
              priority: "$priority",
              dueDate: "$dueDate",
              assignedTo: "$assignedTo",
            },
          },
        },
      },
      {
        $project: {
          project: "$_id",
          totalTasks: 1,
          completedTasks: 1,
          inProgressTasks: 1,
          todoTasks: 1,
          totalEstimatedHours: 1,
          totalActualHours: 1,
          completionRate: {
            $round: [{ $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] }, 2],
          },
          efficiency: {
            $cond: [
              { $gt: ["$totalEstimatedHours", 0] },
              {
                $round: [{ $multiply: [{ $divide: ["$totalEstimatedHours", "$totalActualHours"] }, 100] }, 2],
              },
              0,
            ],
          },
          avgPriority: { $round: ["$avgPriority", 2] },
          tasks: 1,
          _id: 0,
        },
      },
      { $sort: { completionRate: -1 } },
    ])

    // Get overall task statistics
    const overallStats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          todoTasks: {
            $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] },
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [{ $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "completed"] }],
                },
                1,
                0,
              ],
            },
          },
          totalEstimatedHours: { $sum: "$estimatedHours" },
          totalActualHours: { $sum: "$actualHours" },
        },
      },
    ])

    return NextResponse.json({
      projects: projectStats,
      overall: overallStats[0] || {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        overdueTasks: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
      },
    })
  } catch (error) {
    console.error("Get project stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
