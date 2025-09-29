const { body, param, query, validationResult } = require("express-validator")
const mongoose = require("mongoose")

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }))

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    })
  }
  next()
}

// Common validation rules
const commonValidations = {
  mongoId: (field) => param(field).isMongoId().withMessage(`Invalid ${field} format`),

  email: (field = "email") =>
    body(field).isEmail().normalizeEmail().withMessage("Please provide a valid email address"),

  password: (field = "password") =>
    body(field)
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),

  phone: (field = "phone") =>
    body(field)
      .isMobilePhone()
      .withMessage("Please provide a valid phone number")
      .customSanitizer((value) => value.replace(/\D/g, "")), // Remove non-digits

  date: (field) => body(field).isISO8601().withMessage(`${field} must be a valid date`).toDate(),

  positiveNumber: (field) => body(field).isFloat({ min: 0 }).withMessage(`${field} must be a positive number`),

  nonEmptyString: (field) => body(field).trim().notEmpty().withMessage(`${field} is required`).escape(),

  optionalString: (field) => body(field).optional().trim().escape(),

  arrayOfStrings: (field) =>
    body(field)
      .optional()
      .isArray()
      .withMessage(`${field} must be an array`)
      .custom((value) => {
        if (value && !value.every((item) => typeof item === "string")) {
          throw new Error(`All items in ${field} must be strings`)
        }
        return true
      }),

  pagination: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  ],

  dateRange: [
    query("startDate").optional().isISO8601().withMessage("Start date must be valid"),
    query("endDate").optional().isISO8601().withMessage("End date must be valid"),
  ],
}

// Specific validation schemas
const validationSchemas = {
  // User validations
  registerUser: [
    commonValidations.nonEmptyString("username"),
    commonValidations.email(),
    commonValidations.password(),
    body("role").isIn(["admin", "manager", "employee"]).withMessage("Invalid role"),
    body("employeeId").optional().isMongoId().withMessage("Invalid employee ID"),
    handleValidationErrors,
  ],

  loginUser: [
    commonValidations.email(),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],

  changePassword: [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    commonValidations.password("newPassword"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match")
      }
      return true
    }),
    handleValidationErrors,
  ],

  // Employee validations
  createEmployee: [
    commonValidations.nonEmptyString("firstName"),
    commonValidations.nonEmptyString("lastName"),
    commonValidations.email(),
    commonValidations.phone(),
    body("department").isMongoId().withMessage("Valid department ID is required"),
    commonValidations.nonEmptyString("position"),
    commonValidations.positiveNumber("salary"),
    commonValidations.date("hireDate"),
    body("manager").optional().isMongoId().withMessage("Invalid manager ID"),
    handleValidationErrors,
  ],

  updateEmployee: [
    commonValidations.mongoId("id"),
    commonValidations.optionalString("firstName"),
    commonValidations.optionalString("lastName"),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isMobilePhone(),
    body("department").optional().isMongoId().withMessage("Invalid department ID"),
    commonValidations.optionalString("position"),
    body("salary").optional().isFloat({ min: 0 }),
    body("manager").optional().isMongoId().withMessage("Invalid manager ID"),
    body("status").optional().isIn(["active", "inactive", "terminated"]),
    handleValidationErrors,
  ],

  // Task validations
  createTask: [
    commonValidations.nonEmptyString("title"),
    commonValidations.nonEmptyString("description"),
    body("assignedTo").isMongoId().withMessage("Valid employee ID is required"),
    body("priority").isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
    commonValidations.date("dueDate"),
    body("estimatedHours").optional().isFloat({ min: 0 }),
    commonValidations.arrayOfStrings("tags"),
    handleValidationErrors,
  ],

  updateTaskStatus: [
    commonValidations.mongoId("id"),
    body("status").isIn(["pending", "in-progress", "completed", "cancelled"]).withMessage("Invalid status"),
    body("actualHours").optional().isFloat({ min: 0 }),
    handleValidationErrors,
  ],

  // Leave validations
  createLeave: [
    body("type")
      .isIn(["annual", "sick", "maternity", "paternity", "personal", "emergency"])
      .withMessage("Invalid leave type"),
    commonValidations.date("startDate"),
    commonValidations.date("endDate"),
    commonValidations.nonEmptyString("reason"),
    body("endDate").custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date")
      }
      return true
    }),
    handleValidationErrors,
  ],

  // Attendance validations
  checkIn: [
    body("latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
    body("longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
    body("method").optional().isIn(["manual", "biometric", "mobile"]).withMessage("Invalid check-in method"),
    commonValidations.optionalString("address"),
    handleValidationErrors,
  ],

  // Location validations
  recordLocation: [
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required"),
    body("accuracy").optional().isFloat({ min: 0 }).withMessage("Accuracy must be positive"),
    body("activity")
      .optional()
      .isIn(["stationary", "walking", "running", "driving", "unknown"])
      .withMessage("Invalid activity type"),
    commonValidations.optionalString("address"),
    handleValidationErrors,
  ],

  // Department validations
  createDepartment: [
    commonValidations.nonEmptyString("name"),
    commonValidations.optionalString("description"),
    body("manager").optional().isMongoId().withMessage("Invalid manager ID"),
    body("budget").optional().isFloat({ min: 0 }).withMessage("Budget must be positive"),
    commonValidations.optionalString("location"),
    handleValidationErrors,
  ],

  // Payroll validations
  calculatePayroll: [
    body("employeeId").optional().isMongoId().withMessage("Invalid employee ID"),
    commonValidations.date("payPeriodStart"),
    commonValidations.date("payPeriodEnd"),
    body("payPeriodEnd").custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.payPeriodStart)) {
        throw new Error("Pay period end must be after start date")
      }
      return true
    }),
    handleValidationErrors,
  ],
}

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next()
    }

    const errors = []

    req.files.forEach((file, index) => {
      // Check file type
      if (allowedTypes.length > 0) {
        const fileExtension = file.originalname.split(".").pop().toLowerCase()
        if (!allowedTypes.includes(fileExtension)) {
          errors.push(`File ${index + 1}: Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
        }
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: File size exceeds limit of ${maxSize / (1024 * 1024)}MB`)
      }

      // Check for malicious content (basic check)
      if (file.originalname.includes("..") || file.originalname.includes("/")) {
        errors.push(`File ${index + 1}: Invalid file name`)
      }
    })

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "File validation failed",
        errors,
      })
    }

    next()
  }
}

// Custom sanitization middleware
const sanitizeData = (req, res, next) => {
  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        // Remove potential script tags and dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .trim()
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeObject(obj[key])
      }
    }
  }

  if (req.body) sanitizeObject(req.body)
  if (req.query) sanitizeObject(req.query)
  if (req.params) sanitizeObject(req.params)

  next()
}

module.exports = {
  handleValidationErrors,
  commonValidations,
  validationSchemas,
  validateFileUpload,
  sanitizeData,
}
