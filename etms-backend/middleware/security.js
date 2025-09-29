const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const mongoSanitize = require("express-mongo-sanitize")
const xss = require("xss-clean")
const hpp = require("hpp")

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// General API rate limit
const generalLimiter = createRateLimit(15 * 60 * 1000, 100, "Too many requests, please try again later")

// Auth rate limit (stricter)
const authLimiter = createRateLimit(15 * 60 * 1000, 5, "Too many authentication attempts, please try again later")

// File upload rate limit
const uploadLimiter = createRateLimit(60 * 60 * 1000, 10, "Too many file uploads, please try again later")

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
})

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize against NoSQL injection
  mongoSanitize()(req, res, () => {
    // Sanitize against XSS
    xss()(req, res, () => {
      // Prevent HTTP Parameter Pollution
      hpp()(req, res, next)
    })
  })
}

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.get("content-length")
  const maxSize = 50 * 1024 * 1024 // 50MB

  if (contentLength && Number.parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      message: "Request entity too large",
    })
  }

  next()
}

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) return next()

    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    const isAllowed = allowedIPs.some((ip) => clientIP.includes(ip))

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied from this IP address",
      })
    }

    next()
  }
}

// API key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.header("X-API-Key")

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key required",
    })
  }

  // In production, validate against database or environment variable
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(",") : []

  if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key",
    })
  }

  next()
}

// Request timeout middleware
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({
        success: false,
        message: "Request timeout",
      })
    })
    next()
  }
}

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  securityHeaders,
  sanitizeInput,
  requestSizeLimiter,
  ipWhitelist,
  validateApiKey,
  requestTimeout,
}
