const fs = require("fs")
const path = require("path")
const morgan = require("morgan")

// Ensure logs directory exists
const logsDir = path.join(__dirname, "..", "logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Custom token for user info
morgan.token("user", (req) => {
  return req.user ? `${req.user.username}(${req.user.role})` : "anonymous"
})

// Custom token for response time in ms
morgan.token("response-time-ms", (req, res) => {
  const responseTime = res.getHeader("X-Response-Time")
  return responseTime ? `${responseTime}ms` : "-"
})

// Custom format for detailed logging
const detailedFormat =
  ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), { flags: "a" })
const errorLogStream = fs.createWriteStream(path.join(logsDir, "error.log"), { flags: "a" })
const securityLogStream = fs.createWriteStream(path.join(logsDir, "security.log"), { flags: "a" })

// Access logger
const accessLogger = morgan(detailedFormat, {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode >= 400, // Only log successful requests
})

// Error logger
const errorLogger = morgan(detailedFormat, {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400, // Only log errors
})

// Console logger for development
const consoleLogger = morgan("dev")

// Security event logger
const logSecurityEvent = (event, req, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    user: req.user ? `${req.user.username}(${req.user.role})` : "anonymous",
    url: req.originalUrl,
    method: req.method,
    details,
  }

  securityLogStream.write(JSON.stringify(logEntry) + "\n")
}

// Audit logger for sensitive operations
const auditLogger = (action, req, data = {}) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    user: req.user ? `${req.user.username}(${req.user.role})` : "anonymous",
    userId: req.user ? req.user._id : null,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    url: req.originalUrl,
    method: req.method,
    data,
  }

  const auditLogStream = fs.createWriteStream(path.join(logsDir, "audit.log"), { flags: "a" })
  auditLogStream.write(JSON.stringify(auditEntry) + "\n")
}

// Performance logger
const performanceLogger = (req, res, next) => {
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    if (duration > 1000) {
      // Log slow requests (>1 second)
      const slowLogEntry = {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        method: req.method,
        url: req.originalUrl,
        user: req.user ? `${req.user.username}(${req.user.role})` : "anonymous",
        ip: req.ip,
      }

      const slowLogStream = fs.createWriteStream(path.join(logsDir, "slow.log"), { flags: "a" })
      slowLogStream.write(JSON.stringify(slowLogEntry) + "\n")
    }
  })

  next()
}

// Log rotation utility
const rotateLog = (logFile) => {
  const logPath = path.join(logsDir, logFile)
  const backupPath = path.join(logsDir, `${logFile}.${Date.now()}`)

  if (fs.existsSync(logPath)) {
    fs.renameSync(logPath, backupPath)
  }
}

// Schedule log rotation (daily)
const scheduleLogRotation = () => {
  const rotateInterval = 24 * 60 * 60 * 1000 // 24 hours

  setInterval(() => {
    rotateLog("access.log")
    rotateLog("error.log")
    rotateLog("security.log")
    rotateLog("audit.log")
    rotateLog("slow.log")
  }, rotateInterval)
}

module.exports = {
  accessLogger,
  errorLogger,
  consoleLogger,
  logSecurityEvent,
  auditLogger,
  performanceLogger,
  scheduleLogRotation,
}
