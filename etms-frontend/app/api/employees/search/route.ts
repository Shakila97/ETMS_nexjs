import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Employee from "@/models/Employee"
import { requireRole } from "@/lib/auth-middleware"

// GET /api/employees/search - Advanced employee search
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin", "hr_manager", "manager"])

    if (user instanceof NextResponse) {
      return user
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const department = searchParams.get("department")
    const position = searchParams.get("position")
    const status = searchParams.get("status")
    const skills = searchParams.get("skills")
    const hireDateFrom = searchParams.get("hireDateFrom")
    const hireDateTo = searchParams.get("hireDateTo")
    const salaryMin = searchParams.get("salaryMin")
    const salaryMax = searchParams.get("salaryMax")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Build search filter
    const filter: any = {}

    // Text search across multiple fields
    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { employeeId: { $regex: query, $options: "i" } },
        { position: { $regex: query, $options: "i" } },
        { department: { $regex: query, $options: "i" } },
      ]
    }

    // Department filter
    if (department) {
      filter.department = department
    }

    // Position filter
    if (position) {
      filter.position = { $regex: position, $options: "i" }
    }

    // Status filter
    if (status) {
      filter.status = status
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(",").map((s) => s.trim())
      filter.skills = { $in: skillsArray.map((skill) => new RegExp(skill, "i")) }
    }

    // Hire date range filter
    if (hireDateFrom || hireDateTo) {
      filter.hireDate = {}
      if (hireDateFrom) {
        filter.hireDate.$gte = new Date(hireDateFrom)
      }
      if (hireDateTo) {
        filter.hireDate.$lte = new Date(hireDateTo)
      }
    }

    // Salary range filter
    if (salaryMin || salaryMax) {
      filter.salary = {}
      if (salaryMin) {
        filter.salary.$gte = Number.parseInt(salaryMin)
      }
      if (salaryMax) {
        filter.salary.$lte = Number.parseInt(salaryMax)
      }
    }

    // If user is a manager, only show their direct reports and themselves
    if (user.role === "manager" && user.employeeId) {
      filter.$and = [
        filter,
        {
          $or: [{ manager: user.employeeId }, { _id: user.employeeId }],
        },
      ]
    }

    // Execute search
    const employees = await Employee.find(filter)
      .populate("manager", "firstName lastName employeeId")
      .select("firstName lastName email employeeId department position status hireDate salary skills avatar")
      .limit(limit)
      .sort({ firstName: 1, lastName: 1 })
      .lean()

    // Get search suggestions for autocomplete
    const suggestions = await Employee.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: null,
          departments: { $addToSet: "$department" },
          positions: { $addToSet: "$position" },
          skills: { $addToSet: { $arrayElemAt: ["$skills", 0] } },
        },
      },
    ])

    return NextResponse.json({
      employees,
      count: employees.length,
      suggestions: suggestions[0] || {
        departments: [],
        positions: [],
        skills: [],
      },
    })
  } catch (error) {
    console.error("Employee search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
