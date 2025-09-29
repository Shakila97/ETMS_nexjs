import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Task from "@/models/Task"
import { requireRole } from "@/lib/auth-middleware"

// POST /api/tasks/[id]/comments - Add comment to task
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    const task = await Task.findById(params.id)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check permissions - only assigned users, assigner, or admin/HR can comment
    const isAssigned = task.assignedTo.some((empId: any) => empId.toString() === user.employeeId)
    const isAssigner = task.assignedBy.toString() === user.employeeId

    if (user.role === "employee" && !isAssigned && !isAssigner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Add comment
    task.comments.push({
      author: user.employeeId,
      content: content.trim(),
      createdAt: new Date(),
    })

    await task.save()

    // Populate the new comment
    await task.populate("comments.author", "firstName lastName employeeId avatar")

    const newComment = task.comments[task.comments.length - 1]

    return NextResponse.json({ comment: newComment }, { status: 201 })
  } catch (error) {
    console.error("Add task comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
