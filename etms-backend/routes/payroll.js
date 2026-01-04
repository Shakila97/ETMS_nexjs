const express = require("express")
const moment = require("moment")
const Payroll = require("../models/Payroll")
const Employee = require("../models/Employee")
const Attendance = require("../models/Attendance")
const { adminOrManager, canAccessPayroll } = require("../middleware/roleAuth")
const { auth } = require("../middleware/auth")
const { body, validationResult } = require("express-validator")

const router = express.Router()

// @route   POST /api/payroll/calculate
// @desc    Calculate payroll for employee(s)
// @access  Private (Admin/Manager)
router.post(
  "/calculate",
  adminOrManager,
  [
    body("employeeId").optional().isMongoId().withMessage("Valid employee ID required"),
    body("payPeriodStart").isISO8601().withMessage("Valid pay period start date required"),
    body("payPeriodEnd").isISO8601().withMessage("Valid pay period end date required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { employeeId, payPeriodStart, payPeriodEnd } = req.body

      // Build employee query
      const employeeQuery = { status: "active" }
      if (employeeId) employeeQuery._id = employeeId

      const employees = await Employee.find(employeeQuery)

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No employees found",
        })
      }

      const payrollResults = []

      for (const employee of employees) {
        try {
          // Check if payroll already exists for this period
          const existingPayroll = await Payroll.findOne({
            employee: employee._id,
            "payPeriod.startDate": new Date(payPeriodStart),
            "payPeriod.endDate": new Date(payPeriodEnd),
          })

          if (existingPayroll) {
            payrollResults.push({
              employee: employee._id,
              status: "skipped",
              message: "Payroll already exists for this period",
            })
            continue
          }

          // Calculate attendance-based pay
          const attendanceData = await calculateAttendanceData(employee._id, payPeriodStart, payPeriodEnd)

          // Calculate basic salary (assuming monthly salary, prorate for period)
          const periodDays = moment(payPeriodEnd).diff(moment(payPeriodStart), "days") + 1
          const monthlyDays = 30 // Standard month days
          const basicSalary = (employee.salary / monthlyDays) * periodDays

          // Calculate overtime
          const overtimeRate = (employee.salary / (monthlyDays * 8)) * 1.5 // 1.5x rate
          const overtimeAmount = attendanceData.totalOvertimeHours * overtimeRate

          // Calculate allowances (these could be configurable)
          const allowances = {
            transport: 5000, // Fixed transport allowance
            meal: 3000, // Fixed meal allowance
            medical: 2000, // Fixed medical allowance
            other: 0,
          }

          // Calculate deductions
          const grossSalary = basicSalary + overtimeAmount + Object.values(allowances).reduce((a, b) => a + b, 0)

          const deductions = {
            tax: calculateTax(grossSalary), // Simple tax calculation
            insurance: grossSalary * 0.02, // 2% insurance
            providentFund: grossSalary * 0.08, // 8% PF
            other: 0,
          }

          const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)
          const netSalary = grossSalary - totalDeductions

          // Create payroll record
          const payroll = new Payroll({
            employee: employee._id,
            payPeriod: {
              startDate: new Date(payPeriodStart),
              endDate: new Date(payPeriodEnd),
            },
            basicSalary,
            overtime: {
              hours: attendanceData.totalOvertimeHours,
              rate: overtimeRate,
              amount: overtimeAmount,
            },
            allowances,
            deductions,
            grossSalary,
            netSalary,
            processedBy: req.user.employee._id,
            processedDate: new Date(),
          })

          await payroll.save()

          payrollResults.push({
            employee: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            status: "success",
            payrollId: payroll._id,
            netSalary,
          })
        } catch (error) {
          payrollResults.push({
            employee: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            status: "error",
            message: error.message,
          })
        }
      }

      res.json({
        success: true,
        message: "Payroll calculation completed",
        data: { results: payrollResults },
      })
    } catch (error) {
      console.error("Calculate payroll error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/payroll
// @desc    Get payroll records
// @access  Private
router.get("/", auth, canAccessPayroll, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId,
      status,
      payPeriodStart,
      payPeriodEnd,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build query
    const query = {}

    // Role-based access control
    if (req.user.role === "employee") {
      query.employee = req.user.employee._id
    } else if (employeeId) {
      query.employee = employeeId
    }

    // Filters
    if (status) query.status = status

    // Pay period filter
    if (payPeriodStart || payPeriodEnd) {
      query["payPeriod.startDate"] = {}
      if (payPeriodStart) query["payPeriod.startDate"].$gte = new Date(payPeriodStart)
      if (payPeriodEnd) query["payPeriod.startDate"].$lte = new Date(payPeriodEnd)
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const payrolls = await Payroll.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("processedBy", "firstName lastName employeeId")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Payroll.countDocuments(query)

    res.json({
      success: true,
      data: {
        payrolls,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get payroll error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/payroll/:id
// @desc    Get single payroll record
// @access  Private
router.get("/:id", auth, canAccessPayroll, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("employee", "firstName lastName employeeId department email")
      .populate("processedBy", "firstName lastName employeeId")

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      })
    }

    // Check access permissions
    if (req.user.role === "employee" && payroll.employee._id.toString() !== req.user.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: { payroll },
    })
  } catch (error) {
    console.error("Get payroll error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/payroll/:id/status
// @desc    Update payroll status
// @access  Private (Admin/Manager)
router.put("/:id/status", adminOrManager, async (req, res) => {
  try {
    const { status, paymentDate } = req.body
    const payroll = await Payroll.findById(req.params.id)

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      })
    }

    payroll.status = status
    if (status === "paid" && paymentDate) {
      payroll.paymentDate = new Date(paymentDate)
    }

    await payroll.save()

    res.json({
      success: true,
      message: "Payroll status updated successfully",
      data: { payroll },
    })
  } catch (error) {
    console.error("Update payroll status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/payroll/stats/overview
// @desc    Get payroll statistics
// @access  Private (Admin/Manager)
router.get("/stats/overview", adminOrManager, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query

    // Build date query
    const dateQuery = {}
    if (month) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      dateQuery["payPeriod.startDate"] = { $gte: startDate, $lte: endDate }
    } else {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)
      dateQuery["payPeriod.startDate"] = { $gte: startDate, $lte: endDate }
    }

    const stats = await Payroll.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalPayrolls: { $sum: 1 },
          totalGrossSalary: { $sum: "$grossSalary" },
          totalNetSalary: { $sum: "$netSalary" },
          totalDeductions: {
            $sum: {
              $add: ["$deductions.tax", "$deductions.insurance", "$deductions.providentFund", "$deductions.other"],
            },
          },
          totalOvertimeAmount: { $sum: "$overtime.amount" },
          processedPayrolls: {
            $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] },
          },
          paidPayrolls: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
        },
      },
    ])

    // Department-wise payroll
    const departmentStats = await Payroll.aggregate([
      { $match: dateQuery },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeInfo",
        },
      },
      { $unwind: "$employeeInfo" },
      {
        $lookup: {
          from: "departments",
          localField: "employeeInfo.department",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      { $unwind: "$departmentInfo" },
      {
        $group: {
          _id: "$departmentInfo._id",
          departmentName: { $first: "$departmentInfo.name" },
          totalEmployees: { $sum: 1 },
          totalSalary: { $sum: "$netSalary" },
        },
      },
      { $sort: { totalSalary: -1 } },
    ])

    const result = stats[0] || {
      totalPayrolls: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDeductions: 0,
      totalOvertimeAmount: 0,
      processedPayrolls: 0,
      paidPayrolls: 0,
    }

    res.json({
      success: true,
      data: {
        overview: result,
        departmentBreakdown: departmentStats,
      },
    })
  } catch (error) {
    console.error("Get payroll stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Helper function to calculate attendance data
async function calculateAttendanceData(employeeId, startDate, endDate) {
  const attendanceRecords = await Attendance.find({
    employee: employeeId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  })

  const totalHours = attendanceRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0)
  const totalOvertimeHours = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0)
  const totalDays = attendanceRecords.length

  return {
    totalHours,
    totalOvertimeHours,
    totalDays,
  }
}

// Simple tax calculation function
function calculateTax(grossSalary) {
  // Simple progressive tax calculation
  if (grossSalary <= 50000) return 0
  if (grossSalary <= 100000) return (grossSalary - 50000) * 0.1
  if (grossSalary <= 200000) return 5000 + (grossSalary - 100000) * 0.2
  return 25000 + (grossSalary - 200000) * 0.3
}

module.exports = router
