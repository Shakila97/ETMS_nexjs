const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Employee = require("../models/Employee")
const User = require("../models/User")
const Department = require("../models/Department")
const { validateEmployee } = require("../utils/validators")
const { adminOrManager, canAccessEmployee, canModifyEmployee } = require("../middleware/roleAuth")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/profiles"
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// @route   GET /api/employees
// @desc    Get all employees with pagination, search, and filters
// @access  Private (Admin/Manager)
router.get("/", ...adminOrManager, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      department = "",
      status = "",
      position = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build query
    const query = {}

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ]
    }

    // Filters
    if (department) query.department = department
    if (status) query.status = status
    if (position) query.position = { $regex: position, $options: "i" }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    // Execute query
    const employees = await Employee.find(query)
      .populate("department", "name description")
      .populate("manager", "firstName lastName employeeId")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Employee.countDocuments(query)

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get employees error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/employees/:id
// @desc    Get single employee
// @access  Private
router.get("/:id", auth, canAccessEmployee, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("department", "name description manager")
      .populate("manager", "firstName lastName employeeId email")

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      })
    }

    res.json({
      success: true,
      data: { employee },
    })
  } catch (error) {
    console.error("Get employee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (Admin/Manager)
router.post("/", auth, canModifyEmployee, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      department,
      position,
      salary,
      hireDate,
      manager,
      emergencyContact,
      bankDetails,
      workSchedule,
      employeeId,
      createUserAccount,
      password,
    } = req.body

    // Check if employee with email already exists
    const existingEmployee = await Employee.findOne({ email })
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists",
      })
    }

    // Use provided employeeId or generate unique employee ID
    let newEmployeeId = employeeId

    if (!newEmployeeId) {
      // Auto-generate if not provided
      const lastEmployee = await Employee.findOne().sort({ employeeId: -1 })
      newEmployeeId = "EMP001"
      if (lastEmployee && lastEmployee.employeeId) {
        const lastId = Number.parseInt(lastEmployee.employeeId.replace("EMP", ""))
        newEmployeeId = `EMP${String(lastId + 1).padStart(3, "0")}`
      }
    } else {
      // Check if provided employeeId already exists
      const existingEmpId = await Employee.findOne({ employeeId: newEmployeeId })
      if (existingEmpId) {
        return res.status(400).json({
          success: false,
          message: `Employee with ID ${newEmployeeId} already exists`,
        })
      }
    }

    // Verify department exists
    const departmentExists = await Department.findById(department)
    if (!departmentExists) {
      return res.status(400).json({
        success: false,
        message: "Department not found",
      })
    }

    // Verify manager exists if provided
    if (manager) {
      const managerExists = await Employee.findById(manager)
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: "Manager not found",
        })
      }
    }

    // Create employee
    const employee = new Employee({
      employeeId: newEmployeeId,
      firstName,
      lastName,
      email,
      phone,
      address,
      department,
      position,
      salary,
      hireDate,
      manager,
      emergencyContact,
      bankDetails,
      workSchedule,
    })

    await employee.save()

    // Create User Account if requested
    let userCreated = false
    if (createUserAccount) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (!existingUser) {
          const newUser = new User({
            username: `${firstName} ${lastName}`,
            email,
            password: password || "Password@123", // Default password if not provided
            role: "employee",
            employee: employee._id,
          })
          await newUser.save()
          userCreated = true
        } else {
          console.log(`User with email ${email} already exists, skipping user creation`)
        }
      } catch (userError) {
        console.error("Failed to create user account:", userError)
        // We don't fail the request if user creation fails, but we log it
      }
    }

    // Populate references for response
    await employee.populate("department", "name description")
    await employee.populate("manager", "firstName lastName employeeId")

    res.status(201).json({
      success: true,
      message: userCreated
        ? "Employee and user account created successfully"
        : "Employee created successfully",
      data: { employee },
    })
  } catch (error) {
    console.error("Create employee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error" + error.message,
    })
  }
})

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (Admin/Manager)
router.put("/:id", auth, canModifyEmployee, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      })
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      department,
      position,
      salary,
      manager,
      emergencyContact,
      bankDetails,
      workSchedule,
      status,
    } = req.body

    // Check if email is being changed and if it already exists
    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email })
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Employee with this email already exists",
        })
      }
    }

    // Verify department exists if being changed
    if (department && department !== employee.department.toString()) {
      const departmentExists = await Department.findById(department)
      if (!departmentExists) {
        return res.status(400).json({
          success: false,
          message: "Department not found",
        })
      }
    }

    // Verify manager exists if being changed
    if (manager && manager !== employee.manager?.toString()) {
      const managerExists = await Employee.findById(manager)
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: "Manager not found",
        })
      }
    }

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        phone,
        address,
        department,
        position,
        salary,
        manager,
        emergencyContact,
        bankDetails,
        workSchedule,
        status,
      },
      { new: true, runValidators: true },
    )
      .populate("department", "name description")
      .populate("manager", "firstName lastName employeeId")

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: { employee: updatedEmployee },
    })
  } catch (error) {
    console.error("Update employee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/employees/:id
// @desc    Delete employee (soft delete)
// @access  Private (Admin only)
router.delete("/:id", ...adminOrManager, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      })
    }

    // Soft delete by changing status
    employee.status = "terminated"
    await employee.save()

    // Also deactivate associated user account
    const user = await User.findOne({ employee: employee._id })
    if (user) {
      user.isActive = false
      await user.save()
    }

    res.json({
      success: true,
      message: "Employee deleted successfully",
    })
  } catch (error) {
    console.error("Delete employee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/employees/:id/upload-photo
// @desc    Upload employee profile photo
// @access  Private
router.post("/:id/upload-photo", canAccessEmployee, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      })
    }

    // Delete old profile image if exists
    if (employee.profileImage) {
      const oldImagePath = path.join(__dirname, "..", employee.profileImage)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    // Update employee with new image path
    employee.profileImage = `uploads/profiles/${req.file.filename}`
    await employee.save()

    res.json({
      success: true,
      message: "Profile photo uploaded successfully",
      data: {
        profileImage: employee.profileImage,
      },
    })
  } catch (error) {
    console.error("Upload photo error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/employees/stats/overview
// @desc    Get employee statistics
// @access  Private (Admin/Manager)
router.get("/stats/overview", ...adminOrManager, async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments()
    const activeEmployees = await Employee.countDocuments({ status: "active" })
    const inactiveEmployees = await Employee.countDocuments({ status: "inactive" })
    const terminatedEmployees = await Employee.countDocuments({ status: "terminated" })

    // Department-wise count
    const departmentStats = await Employee.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      { $unwind: "$departmentInfo" },
      {
        $group: {
          _id: "$department",
          name: { $first: "$departmentInfo.name" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Position-wise count
    const positionStats = await Employee.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    // Recent hires (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentHires = await Employee.countDocuments({
      hireDate: { $gte: thirtyDaysAgo },
      status: "active",
    })

    res.json({
      success: true,
      data: {
        overview: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: inactiveEmployees,
          terminated: terminatedEmployees,
          recentHires,
        },
        departmentStats,
        positionStats,
      },
    })
  } catch (error) {
    console.error("Get employee stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/employees/bulk-import
// @desc    Bulk import employees
// @access  Private (Admin only)
router.post("/bulk-import", ...adminOrManager, async (req, res) => {
  try {
    const { employees } = req.body

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employees data",
      })
    }

    const results = {
      success: [],
      errors: [],
    }

    for (let i = 0; i < employees.length; i++) {
      try {
        const empData = employees[i]

        // Check if employee already exists
        const existingEmployee = await Employee.findOne({ email: empData.email })
        if (existingEmployee) {
          results.errors.push({
            row: i + 1,
            email: empData.email,
            error: "Employee with this email already exists",
          })
          continue
        }

        // Generate employee ID
        const lastEmployee = await Employee.findOne().sort({ employeeId: -1 })
        let newEmployeeId = "EMP001"
        if (lastEmployee && lastEmployee.employeeId) {
          const lastId = Number.parseInt(lastEmployee.employeeId.replace("EMP", ""))
          newEmployeeId = `EMP${String(lastId + 1).padStart(3, "0")}`
        }

        // Create employee
        const employee = new Employee({
          ...empData,
          employeeId: newEmployeeId,
        })

        await employee.save()
        results.success.push({
          row: i + 1,
          employeeId: newEmployeeId,
          email: empData.email,
        })
      } catch (error) {
        results.errors.push({
          row: i + 1,
          email: employees[i].email,
          error: error.message,
        })
      }
    }

    res.json({
      success: true,
      message: "Bulk import completed",
      data: results,
    })
  } catch (error) {
    console.error("Bulk import error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
