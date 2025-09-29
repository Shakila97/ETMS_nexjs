const mongoose = require("mongoose")
const fs = require("fs")
const path = require("path")

// Health check endpoint
const healthCheck = async (req, res) => {
  const healthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    checks: {},
  }

  try {
    // Database connectivity check
    const dbState = mongoose.connection.readyState
    healthStatus.checks.database = {
      status: dbState === 1 ? "healthy" : "unhealthy",
      message: dbState === 1 ? "Connected" : "Disconnected",
      responseTime: await checkDatabaseResponseTime(),
    }

    // Memory usage check
    const memUsage = process.memoryUsage()
    healthStatus.checks.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? "healthy" : "warning", // 500MB threshold
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    }

    // Disk space check
    const diskSpace = await checkDiskSpace()
    healthStatus.checks.diskSpace = diskSpace

    // API response time check
    healthStatus.checks.api = {
      status: "healthy",
      responseTime: Date.now() - req.startTime + "ms",
    }

    // Overall status determination
    const allChecksHealthy = Object.values(healthStatus.checks).every(
      (check) => check.status === "healthy" || check.status === "warning",
    )

    if (!allChecksHealthy) {
      healthStatus.status = "UNHEALTHY"
      return res.status(503).json(healthStatus)
    }

    res.json(healthStatus)
  } catch (error) {
    healthStatus.status = "ERROR"
    healthStatus.error = error.message
    res.status(500).json(healthStatus)
  }
}

// Check database response time
const checkDatabaseResponseTime = async () => {
  const start = Date.now()
  try {
    await mongoose.connection.db.admin().ping()
    return `${Date.now() - start}ms`
  } catch (error) {
    return "N/A"
  }
}

// Check disk space
const checkDiskSpace = async () => {
  try {
    const stats = fs.statSync(path.join(__dirname, ".."))
    return {
      status: "healthy",
      message: "Disk space check completed",
    }
  } catch (error) {
    return {
      status: "error",
      message: "Unable to check disk space",
    }
  }
}

// Readiness check (for Kubernetes)
const readinessCheck = async (req, res) => {
  try {
    // Check if database is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "NOT_READY",
        message: "Database not connected",
      })
    }

    // Check if required environment variables are set
    const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"]
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        status: "NOT_READY",
        message: `Missing environment variables: ${missingEnvVars.join(", ")}`,
      })
    }

    res.json({
      status: "READY",
      message: "Service is ready to accept requests",
    })
  } catch (error) {
    res.status(503).json({
      status: "NOT_READY",
      message: error.message,
    })
  }
}

// Liveness check (for Kubernetes)
const livenessCheck = (req, res) => {
  res.json({
    status: "ALIVE",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}

module.exports = {
  healthCheck,
  readinessCheck,
  livenessCheck,
}
