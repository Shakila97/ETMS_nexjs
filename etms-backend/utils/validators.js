const { body, validationResult } = require("express-validator")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    })
  }
  next()
}

const validateEmployee = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("department").isMongoId().withMessage("Valid department ID is required"),
  body("position").trim().notEmpty().withMessage("Position is required"),
  body("salary").isNumeric().withMessage("Salary must be a number"),
  body("hireDate").isISO8601().withMessage("Valid hire date is required"),
  handleValidationErrors,
]

const validateTask = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("description").trim().notEmpty().withMessage("Task description is required"),
  body("assignedTo").isMongoId().withMessage("Valid employee ID is required"),
  body("dueDate").isISO8601().withMessage("Valid due date is required"),
  body("priority").isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
  handleValidationErrors,
]

const validateLeave = [
  body("type")
    .isIn(["annual", "sick", "maternity", "paternity", "personal", "emergency"])
    .withMessage("Invalid leave type"),
  body("startDate").isISO8601().withMessage("Valid start date is required"),
  body("endDate").isISO8601().withMessage("Valid end date is required"),
  body("reason").trim().notEmpty().withMessage("Leave reason is required"),
  handleValidationErrors,
]

module.exports = {
  validateEmployee,
  validateTask,
  validateLeave,
  handleValidationErrors,
}
