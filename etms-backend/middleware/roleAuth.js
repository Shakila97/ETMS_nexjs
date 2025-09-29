const { auth, authorize } = require("./auth")

// Middleware combinations for common role checks
const adminOnly = [auth, authorize("admin")]
const adminOrManager = [auth, authorize("admin", "manager")]
const allRoles = [auth, authorize("admin", "manager", "employee")]

// Check if user can access employee data
const canAccessEmployee = async (req, res, next) => {
  try {
    const { role, employee } = req.user
    const targetEmployeeId = req.params.employeeId || req.body.employeeId

    // Admin and managers can access any employee data
    if (role === "admin" || role === "manager") {
      return next()
    }

    // Employees can only access their own data
    if (role === "employee" && employee && employee._id.toString() === targetEmployeeId) {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during authorization check",
    })
  }
}

// Check if user can modify employee data
const canModifyEmployee = async (req, res, next) => {
  try {
    const { role } = req.user

    // Only admin and managers can modify employee data
    if (role === "admin" || role === "manager") {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Insufficient permissions to modify employee data.",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during authorization check",
    })
  }
}

// Check if user can approve leaves
const canApproveLeave = async (req, res, next) => {
  try {
    const { role } = req.user

    // Only admin and managers can approve leaves
    if (role === "admin" || role === "manager") {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Only managers and admins can approve leaves.",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during authorization check",
    })
  }
}

// Check if user can assign tasks
const canAssignTask = async (req, res, next) => {
  try {
    const { role } = req.user

    // Only admin and managers can assign tasks
    if (role === "admin" || role === "manager") {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Only managers and admins can assign tasks.",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during authorization check",
    })
  }
}

// Check if user can access payroll data
const canAccessPayroll = async (req, res, next) => {
  try {
    const { role, employee } = req.user
    const targetEmployeeId = req.params.employeeId || req.body.employeeId

    // Admin can access all payroll data
    if (role === "admin") {
      return next()
    }

    // Managers can access payroll data for their department employees
    if (role === "manager") {
      // TODO: Add department-based access control
      return next()
    }

    // Employees can only access their own payroll data
    if (role === "employee" && employee && employee._id.toString() === targetEmployeeId) {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own payroll data.",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during authorization check",
    })
  }
}

module.exports = {
  adminOnly,
  adminOrManager,
  allRoles,
  canAccessEmployee,
  canModifyEmployee,
  canApproveLeave,
  canAssignTask,
  canAccessPayroll,
}
