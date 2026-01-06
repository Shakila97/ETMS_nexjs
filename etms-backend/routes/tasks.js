const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Task = require("../models/Task")
const Employee = require("../models/Employee")
const { auth } = require("../middleware/auth")
const { allRoles, canAssignTask } = require("../middleware/roleAuth")
const { validateTask } = require("../utils/validators")

const router = express.Router()

// Configure multer for task attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/tasks"
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "task-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype =
      allowedTypes.test(file.mimetype) || file.mimetype.includes("application/") || file.mimetype.includes("text/")

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("File type not allowed"))
    }
  },
})

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (Admin/Manager)
router.post("/", auth, canAssignTask, upload.array("attachments", 10), validateTask, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, estimatedHours, tags, project } = req.body

    // Verify assigned employee exists
    const employee = await Employee.findById(assignedTo)
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Assigned employee not found",
      })
    }

    // Process attachments
    const attachments = []
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/tasks/${file.filename}`,
          size: file.size,
        })
      })
    }

    // Create task
    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.employee ? req.user.employee._id : null,
      priority,
      dueDate: new Date(dueDate),
      estimatedHours: estimatedHours || 0,
      attachments,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      project,
    })

    await task.save()
    await task.populate("assignedTo", "firstName lastName employeeId")
    if (task.project) {
      await task.populate("project", "name")
    }
    if (task.assignedBy) {
      await task.populate("assignedBy", "firstName lastName employeeId")
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task },
    })
  } catch (error) {
    console.error("Create task error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/tasks
// @desc    Get tasks with filters and pagination
// @access  Private
router.get("/", ...allRoles, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      assignedTo,
      assignedBy,
      status,
      priority,
      search,
      tags,
      dueDateFrom,
      dueDateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build query
    const query = {}

    // Role-based filtering
    if (req.user.role === "employee") {
      query.assignedTo = req.user.employee._id
    } else {
      if (assignedTo) query.assignedTo = assignedTo
      if (assignedBy) query.assignedBy = assignedBy
    }

    // Filters
    if (status) query.status = status
    if (priority) query.priority = priority
    if (tags) query.tags = { $in: tags.split(",") }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    // Due date range
    if (dueDateFrom || dueDateTo) {
      query.dueDate = {}
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom)
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo)
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const tasks = await Task.find(query)
      .populate("assignedTo", "firstName lastName employeeId department")
      .populate("assignedBy", "firstName lastName employeeId")
      .populate("project", "name status")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Task.countDocuments(query)

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get("/:id", ...allRoles, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "firstName lastName employeeId department email")
      .populate("assignedBy", "firstName lastName employeeId")
      .populate("project", "name description status") // Populate project details
      .populate("comments.author", "firstName lastName employeeId")

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check access permissions
    if (req.user.role === "employee") {
      if (task.assignedTo._id.toString() !== req.user.employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }
    }

    res.json({
      success: true,
      data: { task },
    })
  } catch (error) {
    console.error("Get task error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put("/:id", ...allRoles, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check permissions
    const canEdit =
      req.user.role === "admin" ||
      req.user.role === "manager" ||
      task.assignedBy.toString() === req.user.employee._id.toString()

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const { title, description, assignedTo, priority, dueDate, estimatedHours, tags, status, project } = req.body

    // Update fields
    if (title) task.title = title
    if (description) task.description = description
    if (assignedTo) {
      const employee = await Employee.findById(assignedTo)
      if (!employee) {
        return res.status(400).json({
          success: false,
          message: "Assigned employee not found",
        })
      }
      task.assignedTo = assignedTo
    }
    if (project) task.project = project
    if (priority) task.priority = priority
    if (dueDate) task.dueDate = new Date(dueDate)
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours
    if (tags) task.tags = tags.split(",").map((tag) => tag.trim())
    if (status) task.status = status

    await task.save()
    await task.populate("assignedTo", "firstName lastName employeeId")
    await task.populate("assignedBy", "firstName lastName employeeId")

    res.json({
      success: true,
      message: "Task updated successfully",
      data: { task },
    })
  } catch (error) {
    console.error("Update task error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/tasks/:id/status
// @desc    Update task status
// @access  Private
router.put("/:id/status", ...allRoles, async (req, res) => {
  try {
    const { status, actualHours } = req.body
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check if user can update status
    const canUpdate =
      req.user.role === "admin" ||
      req.user.role === "manager" ||
      task.assignedTo.toString() === req.user.employee._id.toString() ||
      task.assignedBy.toString() === req.user.employee._id.toString()

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    task.status = status
    if (actualHours !== undefined) task.actualHours = actualHours
    if (status === "completed") task.completedDate = new Date()

    await task.save()

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: { task },
    })
  } catch (error) {
    console.error("Update task status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post("/:id/comments", ...allRoles, async (req, res) => {
  try {
    const { content } = req.body
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      })
    }

    // Check if user can comment
    const canComment =
      req.user.role === "admin" ||
      req.user.role === "manager" ||
      task.assignedTo.toString() === req.user.employee._id.toString() ||
      task.assignedBy.toString() === req.user.employee._id.toString()

    if (!canComment) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    task.comments.push({
      author: req.user.employee._id,
      content: content.trim(),
    })

    await task.save()
    await task.populate("comments.author", "firstName lastName employeeId")

    res.json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment: task.comments[task.comments.length - 1],
      },
    })
  } catch (error) {
    console.error("Add comment error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (Admin/Manager)
router.delete("/:id", auth, canAssignTask, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Delete associated files
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((attachment) => {
        const filePath = path.join(__dirname, "..", attachment.path)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      })
    }

    await Task.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Delete task error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/tasks/stats/overview
// @desc    Get task statistics
// @access  Private
router.get("/stats/overview", ...allRoles, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query

    // Build query
    const query = {}

    // Role-based filtering
    if (req.user.role === "employee") {
      query.assignedTo = req.user.employee._id
    } else if (employeeId) {
      query.assignedTo = employeeId
    }

    // Date range
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const stats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelledTasks: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          totalEstimatedHours: { $sum: "$estimatedHours" },
          totalActualHours: { $sum: "$actualHours" },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [{ $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "completed"] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ])

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ])

    const result = stats[0] || {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      cancelledTasks: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      overdueTasks: 0,
    }

    // Calculate completion rate
    result.completionRate = result.totalTasks > 0 ? (result.completedTasks / result.totalTasks) * 100 : 0

    res.json({
      success: true,
      data: {
        overview: result,
        priorityBreakdown: priorityStats,
      },
    })
  } catch (error) {
    console.error("Get task stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/tasks/my-tasks
// @desc    Get current user's tasks
// @access  Private
router.get("/my-tasks", ...allRoles, async (req, res) => {
  try {
    const { status, priority, limit = 10 } = req.query

    const query = { assignedTo: req.user.employee._id }
    if (status) query.status = status
    if (priority) query.priority = priority

    const tasks = await Task.find(query)
      .populate("assignedBy", "firstName lastName employeeId")
      .sort({ dueDate: 1, priority: -1 })
      .limit(Number.parseInt(limit))

    res.json({
      success: true,
      data: { tasks },
    })
  } catch (error) {
    console.error("Get my tasks error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
