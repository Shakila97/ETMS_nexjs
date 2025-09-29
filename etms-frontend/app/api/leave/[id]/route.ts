import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Leave from "@/models/Leave"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/leave/[id] - Get specific leave request
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const leave = await Leave.findById(params.id)
      .populate("employeeId", "firstName lastName employeeId department position")
      .populate("approvedBy", "firstName lastName employeeId")
      .lean()

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === "employee" && leave.employeeId._id.toString() !== user.employeeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ leave })
  } catch (error) {
    console.error("Get leave request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/leave/[id] - Update leave request (approve/reject/cancel)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { action, rejectionReason, ...updateData } = await request.json()

    const leave = await Leave.findById(params.id)
    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    // Check permissions based on action
    if (action === "approve" || action === "reject") {
      // Only managers, HR, and admins can approve/reject
      if (!["admin", "hr_manager", "manager"].includes(user.role)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      // Managers can only approve their direct reports' leave
      if (user.role === "manager") {
        const employee = await Employee.findById(leave.employeeId)
        if (employee?.manager?.toString() !== user.employeeId) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      }

      if (leave.status !== "pending") {
        return NextResponse.json({ error: "Can only approve/reject pending requests" }, { status: 400 })
      }

      if (action === "approve") {
        leave.status = "approved"
        leave.approvedBy = user.employeeId
        leave.approvedDate = new Date()
      } else {
        leave.status = "rejected"
        leave.approvedBy = user.employeeId
        leave.approvedDate = new Date()
        leave.rejectionReason = rejectionReason
      }
    } else if (action === "cancel") {
      // Employees can cancel their own requests, managers/HR can cancel any
      if (user.role === "employee" && leave.employeeId.toString() !== user.employeeId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (leave.status === "approved" && leave.startDate <= new Date()) {
        return NextResponse.json({ error: "Cannot cancel leave that has already started" }, { status: 400 })
      }

      leave.status = "cancelled"
    } else {
      // Regular update
      if (user.role === "employee" && leave.employeeId.toString() !== user.employeeId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (leave.status !== "pending") {
        return NextResponse.json({ error: "Can only edit pending requests" }, { status: 400 })
      }

      Object.assign(leave, updateData)
    }

    await leave.save()

    // Populate data for response
    await leave.populate("employeeId", "firstName lastName employeeId department")
    await leave.populate("approvedBy", "firstName lastName employeeId")

    return NextResponse.json({ leave })
  } catch (error) {
    console.error("Update leave request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
