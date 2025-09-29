const express = require("express")
const moment = require("moment")
const Attendance = require("../models/Attendance")
const Employee = require("../models/Employee")
const { allRoles, canAccessEmployee } = require("../middleware/roleAuth")
const { body, validationResult } = require("express-validator")

const router = express.Router()

// @route   POST /api/attendance/check-in
// @desc    Check in employee
// @access  Private
router.post(
  "/check-in",
  allRoles,
  [
    body("latitude").optional().isFloat().withMessage("Valid latitude required"),
    body("longitude").optional().isFloat().withMessage("Valid longitude required"),
    body("address").optional().trim(),
    body("method").optional().isIn(["manual", "biometric", "mobile"]).withMessage("Invalid check-in method"),
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

      const { latitude, longitude, address, method = "manual" } = req.body
      const employeeId = req.user.employee._id

      // Get today's date
      const today = moment().startOf("day").toDate()
      const tomorrow = moment().add(1, "day").startOf("day").toDate()

      // Check if already checked in today
      const existingAttendance = await Attendance.findOne({
        employee: employeeId,
        date: { $gte: today, $lt: tomorrow },
      })

      if (existingAttendance && existingAttendance.checkIn.time) {
        return res.status(400).json({
          success: false,
          message: "Already checked in today",
          data: { attendance: existingAttendance },
        })
      }

      const checkInData = {
        time: new Date(),
        method,
      }

      if (latitude && longitude) {
        checkInData.location = {
          latitude,
          longitude,
          address,
        }
      }

      let attendance
      if (existingAttendance) {
        // Update existing record
        existingAttendance.checkIn = checkInData
        attendance = await existingAttendance.save()
      } else {
        // Create new attendance record
        attendance = new Attendance({
          employee: employeeId,
          date: today,
          checkIn: checkInData,
        })
        await attendance.save()
      }

      await attendance.populate("employee", "firstName lastName employeeId")

      res.json({
        success: true,
        message: "Checked in successfully",
        data: { attendance },
      })
    } catch (error) {
      console.error("Check-in error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/attendance/check-out
// @desc    Check out employee
// @access  Private
router.post(
  "/check-out",
  allRoles,
  [
    body("latitude").optional().isFloat().withMessage("Valid latitude required"),
    body("longitude").optional().isFloat().withMessage("Valid longitude required"),
    body("address").optional().trim(),
    body("method").optional().isIn(["manual", "biometric", "mobile"]).withMessage("Invalid check-out method"),
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

      const { latitude, longitude, address, method = "manual" } = req.body
      const employeeId = req.user.employee._id

      // Get today's date
      const today = moment().startOf("day").toDate()
      const tomorrow = moment().add(1, "day").startOf("day").toDate()

      // Find today's attendance record
      const attendance = await Attendance.findOne({
        employee: employeeId,
        date: { $gte: today, $lt: tomorrow },
      })

      if (!attendance || !attendance.checkIn.time) {
        return res.status(400).json({
          success: false,
          message: "No check-in record found for today",
        })
      }

      if (attendance.checkOut.time) {
        return res.status(400).json({
          success: false,
          message: "Already checked out today",
        })
      }

      const checkOutData = {
        time: new Date(),
        method,
      }

      if (latitude && longitude) {
        checkOutData.location = {
          latitude,
          longitude,
          address,
        }
      }

      attendance.checkOut = checkOutData

      // Calculate total hours
      const checkInTime = moment(attendance.checkIn.time)
      const checkOutTime = moment(checkOutData.time)
      const totalMinutes = checkOutTime.diff(checkInTime, "minutes")

      // Subtract break time
      let breakMinutes = 0
      if (attendance.breakTime && attendance.breakTime.length > 0) {
        breakMinutes = attendance.breakTime.reduce((total, breakPeriod) => {
          if (breakPeriod.start && breakPeriod.end) {
            return total + moment(breakPeriod.end).diff(moment(breakPeriod.start), "minutes")
          }
          return total
        }, 0)
      }

      attendance.totalHours = Math.max(0, (totalMinutes - breakMinutes) / 60)

      // Calculate overtime (assuming 8 hours is standard)
      const standardHours = 8
      attendance.overtimeHours = Math.max(0, attendance.totalHours - standardHours)

      await attendance.save()
      await attendance.populate("employee", "firstName lastName employeeId")

      res.json({
        success: true,
        message: "Checked out successfully",
        data: { attendance },
      })
    } catch (error) {
      console.error("Check-out error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/attendance/break-start
// @desc    Start break
// @access  Private
router.post("/break-start", allRoles, async (req, res) => {
  try {
    const employeeId = req.user.employee._id

    // Get today's date
    const today = moment().startOf("day").toDate()
    const tomorrow = moment().add(1, "day").startOf("day").toDate()

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today, $lt: tomorrow },
    })

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: "No check-in record found for today",
      })
    }

    // Check if already on break
    const activeBreak = attendance.breakTime.find((breakPeriod) => breakPeriod.start && !breakPeriod.end)

    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: "Break already started",
      })
    }

    // Add new break period
    attendance.breakTime.push({
      start: new Date(),
    })

    await attendance.save()

    res.json({
      success: true,
      message: "Break started successfully",
      data: { attendance },
    })
  } catch (error) {
    console.error("Break start error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/attendance/break-end
// @desc    End break
// @access  Private
router.post("/break-end", allRoles, async (req, res) => {
  try {
    const employeeId = req.user.employee._id

    // Get today's date
    const today = moment().startOf("day").toDate()
    const tomorrow = moment().add(1, "day").startOf("day").toDate()

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today, $lt: tomorrow },
    })

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: "No check-in record found for today",
      })
    }

    // Find active break
    const activeBreakIndex = attendance.breakTime.findIndex((breakPeriod) => breakPeriod.start && !breakPeriod.end)

    if (activeBreakIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "No active break found",
      })
    }

    // End the break
    const endTime = new Date()
    attendance.breakTime[activeBreakIndex].end = endTime
    attendance.breakTime[activeBreakIndex].duration = moment(endTime).diff(
      moment(attendance.breakTime[activeBreakIndex].start),
      "minutes",
    )

    await attendance.save()

    res.json({
      success: true,
      message: "Break ended successfully",
      data: { attendance },
    })
  } catch (error) {
    console.error("Break end error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get("/", allRoles, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId,
      startDate,
      endDate,
      status,
      sortBy = "date",
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

    // Date range filter
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    // Status filter
    if (status) query.status = status

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const attendanceRecords = await Attendance.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Attendance.countDocuments(query)

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/attendance/today
// @desc    Get today's attendance status
// @access  Private
router.get("/today", allRoles, async (req, res) => {
  try {
    const employeeId = req.user.employee._id

    // Get today's date
    const today = moment().startOf("day").toDate()
    const tomorrow = moment().add(1, "day").startOf("day").toDate()

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today, $lt: tomorrow },
    }).populate("employee", "firstName lastName employeeId")

    res.json({
      success: true,
      data: { attendance },
    })
  } catch (error) {
    console.error("Get today's attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics
// @access  Private
router.get("/stats", allRoles, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query

    // Build query
    const query = {}

    // Role-based access control
    if (req.user.role === "employee") {
      query.employee = req.user.employee._id
    } else if (employeeId) {
      query.employee = employeeId
    }

    // Date range (default to current month)
    const start = startDate ? new Date(startDate) : moment().startOf("month").toDate()
    const end = endDate ? new Date(endDate) : moment().endOf("month").toDate()
    query.date = { $gte: start, $lte: end }

    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0],
            },
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "absent"] }, 1, 0],
            },
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "late"] }, 1, 0],
            },
          },
          totalHours: { $sum: "$totalHours" },
          totalOvertimeHours: { $sum: "$overtimeHours" },
          averageHours: { $avg: "$totalHours" },
        },
      },
    ])

    const result = stats[0] || {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      totalHours: 0,
      totalOvertimeHours: 0,
      averageHours: 0,
    }

    // Calculate attendance percentage
    result.attendancePercentage = result.totalDays > 0 ? (result.presentDays / result.totalDays) * 100 : 0

    res.json({
      success: true,
      data: { stats: result },
    })
  } catch (error) {
    console.error("Get attendance stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
