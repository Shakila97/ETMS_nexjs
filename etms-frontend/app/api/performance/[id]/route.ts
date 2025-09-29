import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Performance from "@/models/Performance"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/performance/[id] - Get specific performance review
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const review = await Performance.findById(params.id)
      .populate("employeeId", "firstName lastName employeeId department position avatar")
      .populate("reviewerId", "firstName lastName employeeId")
      .lean()

    if (!review) {
      return NextResponse.json({ error: "Performance review not found" }, { status: 404 })
    }

    // Check permissions
    const isEmployee = review.employeeId._id.toString() === user.employeeId
    const isReviewer = review.reviewerId._id.toString() === user.employeeId

    if (user.role === "employee" && !isEmployee) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error("Get performance review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/performance/[id] - Update performance review
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager", "employee"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const updateData = await request.json()

    const review = await Performance.findById(params.id)
    if (!review) {
      return NextResponse.json({ error: "Performance review not found" }, { status: 404 })
    }

    // Check permissions and handle different update scenarios
    const isEmployee = review.employeeId.toString() === user.employeeId
    const isReviewer = review.reviewerId.toString() === user.employeeId

    if (updateData.action === "submit") {
      // Reviewer submitting the review
      if (!isReviewer && !["admin", "hr_manager"].includes(user.role)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (review.status !== "draft") {
        return NextResponse.json({ error: "Can only submit draft reviews" }, { status: 400 })
      }

      review.status = "submitted"
      review.submittedDate = new Date()
    } else if (updateData.action === "approve") {
      // HR/Admin approving the review
      if (!["admin", "hr_manager"].includes(user.role)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (review.status !== "submitted") {
        return NextResponse.json({ error: "Can only approve submitted reviews" }, { status: 400 })
      }

      review.status = "approved"
      review.approvedDate = new Date()
    } else if (updateData.action === "acknowledge") {
      // Employee acknowledging the review
      if (!isEmployee) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (review.status !== "approved") {
        return NextResponse.json({ error: "Can only acknowledge approved reviews" }, { status: 400 })
      }

      review.status = "acknowledged"
      review.employeeComments = updateData.employeeComments
    } else {
      // Regular update
      if (user.role === "employee") {
        // Employees can only add comments to their own reviews
        if (!isEmployee) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        review.employeeComments = updateData.employeeComments
      } else {
        // Managers/HR can update review content
        if (!isReviewer && !["admin", "hr_manager"].includes(user.role)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        if (review.status !== "draft") {
          return NextResponse.json({ error: "Can only edit draft reviews" }, { status: 400 })
        }

        Object.assign(review, updateData)
      }
    }

    await review.save()

    // Populate data for response
    await review.populate("employeeId", "firstName lastName employeeId department position")
    await review.populate("reviewerId", "firstName lastName employeeId")

    return NextResponse.json({ review })
  } catch (error) {
    console.error("Update performance review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
