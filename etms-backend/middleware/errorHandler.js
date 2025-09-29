const { logSecurityEvent } = require("./logging")

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"

    Error.captureStackTrace(this, this.constructor)
  }
}

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
  const message = `Duplicate field value: ${value}. Please use another value!`
  return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Invalid input data. ${errors.join(". ")}`
  return new AppError(message, 400)
}

const handleJWTError = () => new AppError("Invalid token. Please log in again!", 401)

const handleJWTExpiredError = () => new AppError("Your token has expired! Please log in again.", 401)

// Send error response for development
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

// Send error response for production
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("ERROR 💥", err)

    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    })
  }
}

// Main error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  // Log security-related errors
  if (err.statusCode === 401 || err.statusCode === 403) {
    logSecurityEvent("UNAUTHORIZED_ACCESS", req, {
      error: err.message,
      statusCode: err.statusCode,
    })
  }

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res)
  } else {
    let error = { ...err }
    error.message = err.message

    // Handle specific error types
    if (error.name === "CastError") error = handleCastErrorDB(error)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error)
    if (error.name === "ValidationError") error = handleValidationErrorDB(error)
    if (error.name === "JsonWebTokenError") error = handleJWTError()
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError()

    sendErrorProd(error, req, res)
  }
}

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

// Handle unhandled promise rejections
const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (err, promise) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...")
    console.log(err.name, err.message)
    process.exit(1)
  })
}

// Handle uncaught exceptions
const handleUncaughtException = () => {
  process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...")
    console.log(err.name, err.message)
    process.exit(1)
  })
}

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException,
}
