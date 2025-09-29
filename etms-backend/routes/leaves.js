const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const moment = require("moment")
const Leave = require("../models/Leave")
const Employee = require("../models/Employee")
const mongoose = require("mongoose") // Import mongoose
const { allRoles, canApproveLeave } = require("../middleware/roleAuth")
const { validateLeave } = require("../utils/validators")

const router = express.Router()

// Configure multer for leave attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/leaves"
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "leave-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === "application/pdf"

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image and document files are allowed"))
    }
  },
})

// @route   POST /api/leaves
// @desc    Submit leave request
// @access  Private
router.post("/", allRoles, upload.array("attachments", 5), validateLeave, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body
    const employeeId = req.user.employee._id

    // Calculate total days
    const start = moment(startDate)
    const end = moment(endDate)
    const totalDays = end.diff(start, "days") + 1

    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      })
    }

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      employee: employeeId,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    })

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: "You already have a leave request for this period",
      })
    }

    // Process attachments
    const attachments = []
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/leaves/${file.filename}`,
        })
      })
    }

    // Create leave request
    const leave = new Leave({
      employee: employeeId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      reason,
      attachments,
    })

    await leave.save()
    await leave.populate("employee", "firstName lastName employeeId department")

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: { leave },
    })
  } catch (error) {
    console.error("Submit leave error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/leaves
// @desc    Get leave requests
// @access  Private
router.get("/", allRoles, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId,
      status,
      type,
      startDate,
      endDate,
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
    if (type) query.type = type

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {}
      if (startDate) query.startDate.$gte = new Date(startDate)
      if (endDate) query.startDate.$lte = new Date(endDate)
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const leaves = await Leave.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("approvedBy", "firstName lastName employeeId")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Leave.countDocuments(query)

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get leaves error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/leaves/:id
// @desc    Get single leave request
// @access  Private
router.get("/:id", allRoles, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("employee", "firstName lastName employeeId department email")
      .populate("approvedBy", "firstName lastName employeeId")

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    // Check access permissions
    if (req.user.role === "employee" && leave.employee._id.toString() !== req.user.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: { leave },
    })
  } catch (error) {
    console.error("Get leave error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave request
// @access  Private (Admin/Manager)
router.put("/:id/approve", canApproveLeave, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Leave request is not pending",
      })
    }

    leave.status = "approved"
    leave.approvedBy = req.user.employee._id
    leave.approvedDate = new Date()

    await leave.save()
    await leave.populate("employee", "firstName lastName employeeId")
    await leave.populate("approvedBy", "firstName lastName employeeId")

    res.json({
      success: true,
      message: "Leave request approved successfully",
      data: { leave },
    })
  } catch (error) {
    console.error("Approve leave error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave request
// @access  Private (Admin/Manager)
router.put("/:id/reject", canApproveLeave, async (req, res) => {
  try {
    const { rejectionReason } = req.body

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      })
    }

    const leave = await Leave.findById(req.params.id)

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Leave request is not pending",
      })
    }

    leave.status = "rejected"
    leave.approvedBy = req.user.employee._id
    leave.approvedDate = new Date()
    leave.rejectionReason = rejectionReason

    await leave.save()
    await leave.populate("employee", "firstName lastName employeeId")
    await leave.populate("approvedBy", "firstName lastName employeeId")

    res.json({
      success: true,
      message: "Leave request rejected successfully",
      data: { leave },
    })
  } catch (error) {
    console.error("Reject leave error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/leaves/:id/cancel
// @desc    Cancel leave request
// @access  Private
router.put("/:id/cancel", allRoles, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    // Check if user can cancel this leave
    if (req.user.role === "employee" && leave.employee.toString() !== req.user.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own leave requests",
      })
    }

    if (leave.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Leave request is already cancelled",
      })
    }

    leave.status = "cancelled"
    await leave.save()

    res.json({
      success: true,
      message: "Leave request cancelled successfully",
      data: { leave },
    })
  } catch (error) {
    console.error("Cancel leave error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/leaves/stats/overview
// @desc    Get leave statistics
// @access  Private
router.get("/stats/overview", allRoles, async (req, res) => {
  try {
    const { employeeId, year = new Date().getFullYear() } = req.query

    // Build query
    const query = {
      startDate: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      },
    }

    // Role-based access control
    if (req.user.role === "employee") {
      query.employee = req.user.employee._id
    } else if (employeeId) {
      query.employee = employeeId
    }

    const stats = await Leave.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          totalDaysTaken: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, "$totalDays", 0] },
          },
        },
      },
    ])

    // Leave type breakdown
    const typeStats = await Leave.aggregate([
      { $match: { ...query, status: "approved" } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalDays: { $sum: "$totalDays" },
        },
      },
    ])

    const result = stats[0] || {
      totalRequests: 0,
      approvedRequests: 0,
      pendingRequests: 0,
      rejectedRequests: 0,
      totalDaysTaken: 0,
    }

    res.json({
      success: true,
      data: {
        overview: result,
        typeBreakdown: typeStats,
      },
    })
  } catch (error) {
    console.error("Get leave stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/leaves/balance/:employeeId
// @desc    Get leave balance for employee
// @access  Private
router.get("/balance/:employeeId", allRoles, async (req, res) => {
  try {
    const { employeeId } = req.params
    const { year = new Date().getFullYear() } = req.query

    // Check access permissions
    if (req.user.role === "employee" && employeeId !== req.user.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Define leave entitlements (this could be stored in database)
    const leaveEntitlements = {
      annual: 21,
      sick: 10,
      maternity: 90,
      paternity: 7,
      personal: 5,
      emergency: 3,
    }

    // Calculate used leaves
    const usedLeaves = await Leave.aggregate([
      {
        $match: {
          employee: mongoose.Types.ObjectId(employeeId),
          status: "approved",
          startDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: "$type",
          used: { $sum: "$totalDays" },
        },
      },
    ])

    // Calculate balance
    const balance = {}
    Object.keys(leaveEntitlements).forEach((type) => {
      const used = usedLeaves.find((leave) => leave._id === type)?.used || 0
      balance[type] = {
        entitled: leaveEntitlements[type],
        used,
        remaining: leaveEntitlements[type] - used,
      }
    })

    res.json({
      success: true,
      data: { balance },
    })
  } catch (error) {
    console.error("Get leave balance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
