import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Attendance from "@/models/Attendance"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/attendance/[id] - Get specific attendance record
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const attendance = await Attendance.findById(params.id)
      .populate("employeeId", "firstName lastName employeeId department position")
      .lean()

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === "employee" && attendance.employeeId._id.toString() !== user.employeeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Get attendance record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/attendance/[id] - Update attendance record
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const updateData = await request.json()

    const attendance = await Attendance.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("employeeId", "firstName lastName employeeId")

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Update attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
