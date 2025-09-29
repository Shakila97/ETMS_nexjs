import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Task from "@/models/Task"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/tasks/[id] - Get specific task
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const task = await Task.findById(params.id)
      .populate("assignedTo", "firstName lastName employeeId department position avatar")
      .populate("assignedBy", "firstName lastName employeeId")
      .populate("comments.author", "firstName lastName employeeId avatar")
      .lean()

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check permissions
    const isAssigned = task.assignedTo.some((emp: any) => emp._id.toString() === user.employeeId)
    const isAssigner = task.assignedBy._id.toString() === user.employeeId

    if (user.role === "employee" && !isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Get task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const updateData = await request.json()

    const task = await Task.findById(params.id)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check permissions
    const isAssigned = task.assignedTo.some((empId: any) => empId.toString() === user.employeeId)
    const isAssigner = task.assignedBy.toString() === user.employeeId

    if (user.role === "employee" && !isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Employees can only update certain fields
    if (user.role === "employee") {
      const allowedFields = ["status", "actualHours", "comments"]
      const filteredData: any = {}
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field]
        }
      }
      Object.assign(task, filteredData)
    } else {
      Object.assign(task, updateData)
    }

    await task.save()

    // Populate data for response
    await task.populate("assignedTo", "firstName lastName employeeId department position")
    await task.populate("assignedBy", "firstName lastName employeeId")

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const task = await Task.findById(params.id)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Only the assigner or admin/HR can delete tasks
    if (user.role === "manager" && task.assignedBy.toString() !== user.employeeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    await Task.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
