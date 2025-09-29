const express = require("express")
const Location = require("../models/Location")
const Employee = require("../models/Employee")
const { allRoles, adminOrManager } = require("../middleware/roleAuth")
const { body, validationResult } = require("express-validator")

const router = express.Router()

// @route   POST /api/locations
// @desc    Record employee location
// @access  Private
router.post(
  "/",
  allRoles,
  [
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    body("accuracy").optional().isFloat().withMessage("Accuracy must be a number"),
    body("activity").optional().isIn(["stationary", "walking", "running", "driving", "unknown"]),
    body("address").optional().trim(),
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

      const { latitude, longitude, accuracy, activity, address } = req.body
      const employeeId = req.user.employee._id

      // Create location record
      const location = new Location({
        employee: employeeId,
        latitude,
        longitude,
        accuracy,
        activity: activity || "unknown",
        address,
      })

      await location.save()
      await location.populate("employee", "firstName lastName employeeId")

      res.status(201).json({
        success: true,
        message: "Location recorded successfully",
        data: { location },
      })
    } catch (error) {
      console.error("Record location error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/locations
// @desc    Get location history
// @access  Private
router.get("/", allRoles, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      employeeId,
      startDate,
      endDate,
      activity,
      sortBy = "timestamp",
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
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = new Date(startDate)
      if (endDate) query.timestamp.$lte = new Date(endDate)
    }

    // Activity filter
    if (activity) query.activity = activity

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const locations = await Location.find(query)
      .populate("employee", "firstName lastName employeeId")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Location.countDocuments(query)

    res.json({
      success: true,
      data: {
        locations,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get locations error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/locations/current
// @desc    Get current locations of all employees
// @access  Private (Admin/Manager)
router.get("/current", adminOrManager, async (req, res) => {
  try {
    // Get the latest location for each employee
    const currentLocations = await Location.aggregate([
      {
        $sort: { employee: 1, timestamp: -1 },
      },
      {
        $group: {
          _id: "$employee",
          latestLocation: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestLocation" },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $unwind: "$employee",
      },
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
      },
      {
        $sort: { timestamp: -1 },
      },
    ])

    res.json({
      success: true,
      data: { locations: currentLocations },
    })
  } catch (error) {
    console.error("Get current locations error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/locations/employee/:employeeId/route
// @desc    Get employee's route for a specific date
// @access  Private
router.get("/employee/:employeeId/route", allRoles, async (req, res) => {
  try {
    const { employeeId } = req.params
    const { date = new Date().toISOString().split("T")[0] } = req.query

    // Check access permissions
    if (req.user.role === "employee" && employeeId !== req.user.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Get start and end of the day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const route = await Location.find({
      employee: employeeId,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("employee", "firstName lastName employeeId")
      .sort({ timestamp: 1 })

    // Calculate total distance traveled (simple approximation)
    let totalDistance = 0
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1]
      const curr = route[i]
      const distance = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
      totalDistance += distance
    }

    res.json({
      success: true,
      data: {
        route,
        totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
        totalPoints: route.length,
      },
    })
  } catch (error) {
    console.error("Get employee route error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/locations/stats
// @desc    Get location statistics
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

    // Date range (default to last 7 days)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    query.timestamp = { $gte: start, $lte: end }

    const stats = await Location.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          activities: {
            $push: "$activity",
          },
          avgAccuracy: { $avg: "$accuracy" },
          firstRecord: { $min: "$timestamp" },
          lastRecord: { $max: "$timestamp" },
        },
      },
    ])

    // Activity breakdown
    const activityStats = await Location.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$activity",
          count: { $sum: 1 },
        },
      },
    ])

    const result = stats[0] || {
      totalRecords: 0,
      avgAccuracy: 0,
      firstRecord: null,
      lastRecord: null,
    }

    res.json({
      success: true,
      data: {
        overview: result,
        activityBreakdown: activityStats,
      },
    })
  } catch (error) {
    console.error("Get location stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/locations/cleanup
// @desc    Clean up old location data
// @access  Private (Admin only)
router.delete("/cleanup", adminOrManager, async (req, res) => {
  try {
    const { days = 90 } = req.query
    const cutoffDate = new Date(Date.now() - Number.parseInt(days) * 24 * 60 * 60 * 1000)

    const result = await Location.deleteMany({
      timestamp: { $lt: cutoffDate },
    })

    res.json({
      success: true,
      message: `Cleaned up location data older than ${days} days`,
      data: {
        deletedCount: result.deletedCount,
      },
    })
  } catch (error) {
    console.error("Location cleanup error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers
  return distance
}

module.exports = router
