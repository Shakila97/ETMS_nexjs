const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

// Import security middleware
const {
  generalLimiter,
  authLimiter,
  securityHeaders,
  sanitizeInput,
  requestSizeLimiter,
  requestTimeout,
} = require("./middleware/security")

// Import logging middleware
const {
  accessLogger,
  errorLogger,
  consoleLogger,
  performanceLogger,
  scheduleLogRotation,
} = require("./middleware/logging")

// Import validation middleware
const { sanitizeData } = require("./middleware/validation")

// Import error handling
const {
  globalErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
} = require("./middleware/errorHandler")

// Import utilities
const { setupSwagger } = require("./utils/apiDocumentation")
const {
  healthCheck,
  readinessCheck,
  livenessCheck,
} = require("./utils/healthCheck")

const app = express()

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException()
handleUnhandledRejection()

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1)

// Security middleware
app.use(securityHeaders)
app.use(requestTimeout())
app.use(requestSizeLimiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
)

// Logging middleware
if (process.env.NODE_ENV === "production") {
  app.use(accessLogger)
  app.use(errorLogger)
  scheduleLogRotation()
} else {
  app.use(consoleLogger)
}

app.use(performanceLogger)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Input sanitization
app.use(sanitizeInput)
app.use(sanitizeData)

// Rate limiting
app.use("/api/auth", authLimiter)
app.use("/api/", generalLimiter)

// Health check endpoints
app.get("/health", healthCheck)
app.get("/ready", readinessCheck)
app.get("/alive", livenessCheck)

// API documentation (swagger in dev)
if (process.env.NODE_ENV !== "production") {
  setupSwagger(app)
}

// Database connection with retry logic
const connectDB = async () => {
  const maxRetries = 5
  let retries = 0

  while (retries < maxRetries) {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI ||
        "mongodb+srv://shakilasandun_db_user:hPKhSIyVvYSCNr6X@cluster0.ovmfsbu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      )
      console.log("✅ MongoDB connected successfully")
      break
    } catch (error) {
      retries++
      console.error(
        `❌ MongoDB connection attempt ${retries} failed:`,
        error.message
      )
      if (retries === maxRetries) {
        console.error("Max retries reached. Exiting...")
        process.exit(1)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds
    }
  }
}
connectDB()

// ========================
// Routes
// ========================
app.use("/api/auth", require("./routes/auth"))
app.use("/api/employees", require("./routes/employees"))
app.use("/api/attendance", require("./routes/attendance"))
app.use("/api/tasks", require("./routes/tasks"))
app.use("/api/leaves", require("./routes/leaves"))
app.use("/api/departments", require("./routes/departments"))
app.use("/api/payroll", require("./routes/payroll"))
app.use("/api/reports", require("./routes/reports"))
app.use("/api/locations", require("./routes/locations"))

// ✅ Test Route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Hello from backend 🚀" })
})

// Serve static files
app.use("/uploads", express.static("uploads"))

// Global error handling middleware
app.use(globalErrorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    availableEndpoints: [
      "/api/auth",
      "/api/employees",
      "/api/attendance",
      "/api/tasks",
      "/api/leaves",
      "/api/departments",
      "/api/payroll",
      "/api/reports",
      "/api/locations",
      "/api/test",
      "/health",
    ],
  })
})

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)

  server.close(() => {
    console.log("HTTP server closed.")

    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.")
      process.exit(0)
    })
  })
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

module.exports = app
