const express = require("express")
const Department = require("../models/Department")
const Employee = require("../models/Employee")
const { adminOrManager } = require("../middleware/roleAuth")
const { body, validationResult } = require("express-validator")

const router = express.Router()

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get("/", adminOrManager, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive } = req.query

    // Build query
    const query = {}
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }
    if (isActive !== undefined) {
      query.isActive = isActive === "true"
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const departments = await Department.find(query)
      .populate("manager", "firstName lastName employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Department.countDocuments(query)

    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({
          department: dept._id,
          status: "active",
        })
        return {
          ...dept.toObject(),
          employeeCount,
        }
      }),
    )

    res.json({
      success: true,
      data: {
        departments: departmentsWithCount,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get departments error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/departments/:id
// @desc    Get single department
// @access  Private
router.get("/:id", adminOrManager, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      "manager",
      "firstName lastName employeeId email",
    )

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      })
    }

    // Get department employees
    const employees = await Employee.find({
      department: department._id,
      status: "active",
    }).select("firstName lastName employeeId position email")

    res.json({
      success: true,
      data: {
        department: {
          ...department.toObject(),
          employees,
          employeeCount: employees.length,
        },
      },
    })
  } catch (error) {
    console.error("Get department error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/departments
// @desc    Create new department
// @access  Private (Admin/Manager)
router.post(
  "/",
  adminOrManager,
  [
    body("name").trim().notEmpty().withMessage("Department name is required"),
    body("description").optional().trim(),
    body("manager").optional().isMongoId().withMessage("Valid manager ID required"),
    body("budget").optional().isNumeric().withMessage("Budget must be a number"),
    body("location").optional().trim(),
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

      const { name, description, manager, budget, location } = req.body

      // Check if department already exists
      const existingDepartment = await Department.findOne({ name })
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department with this name already exists",
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

      const department = new Department({
        name,
        description,
        manager,
        budget,
        location,
      })

      await department.save()
      await department.populate("manager", "firstName lastName employeeId")

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: { department },
      })
    } catch (error) {
      console.error("Create department error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Admin/Manager)
router.put("/:id", adminOrManager, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      })
    }

    const { name, description, manager, budget, location, isActive } = req.body

    // Check if name is being changed and if it already exists
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ name })
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department with this name already exists",
        })
      }
    }

    // Verify manager exists if being changed
    if (manager && manager !== department.manager?.toString()) {
      const managerExists = await Employee.findById(manager)
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: "Manager not found",
        })
      }
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        manager,
        budget,
        location,
        isActive,
      },
      { new: true, runValidators: true },
    ).populate("manager", "firstName lastName employeeId")

    res.json({
      success: true,
      message: "Department updated successfully",
      data: { department: updatedDepartment },
    })
  } catch (error) {
    console.error("Update department error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Admin only)
router.delete("/:id", adminOrManager, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      })
    }

    // Check if department has employees
    const employeeCount = await Employee.countDocuments({
      department: department._id,
      status: "active",
    })

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete department with active employees. Please reassign employees first.",
      })
    }

    await Department.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Department deleted successfully",
    })
  } catch (error) {
    console.error("Delete department error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/departments/stats/overview
// @desc    Get department statistics
// @access  Private (Admin/Manager)
router.get("/stats/overview", adminOrManager, async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments()
    const activeDepartments = await Department.countDocuments({ isActive: true })

    // Department with most employees
    const departmentStats = await Employee.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$department",
          employeeCount: { $sum: 1 },
          totalSalary: { $sum: "$salary" },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      { $unwind: "$departmentInfo" },
      {
        $project: {
          name: "$departmentInfo.name",
          employeeCount: 1,
          totalSalary: 1,
          averageSalary: { $divide: ["$totalSalary", "$employeeCount"] },
        },
      },
      { $sort: { employeeCount: -1 } },
    ])

    res.json({
      success: true,
      data: {
        overview: {
          total: totalDepartments,
          active: activeDepartments,
          inactive: totalDepartments - activeDepartments,
        },
        departmentStats,
      },
    })
  } catch (error) {
    console.error("Get department stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
