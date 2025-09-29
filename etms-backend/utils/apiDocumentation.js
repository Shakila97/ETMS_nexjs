const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express")

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Employee Tracking Management System API",
      version: "1.0.0",
      description: "Comprehensive API for managing employees, attendance, tasks, and payroll",
      contact: {
        name: "ETMS Team",
        email: "support@etms.com",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "manager", "employee"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Employee: {
          type: "object",
          properties: {
            _id: { type: "string" },
            employeeId: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            department: { $ref: "#/components/schemas/Department" },
            position: { type: "string" },
            salary: { type: "number" },
            hireDate: { type: "string", format: "date" },
            status: { type: "string", enum: ["active", "inactive", "terminated"] },
          },
        },
        Department: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            manager: { $ref: "#/components/schemas/Employee" },
            budget: { type: "number" },
            isActive: { type: "boolean" },
          },
        },
        Task: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            assignedTo: { $ref: "#/components/schemas/Employee" },
            assignedBy: { $ref: "#/components/schemas/Employee" },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
            status: { type: "string", enum: ["pending", "in-progress", "completed", "cancelled"] },
            dueDate: { type: "string", format: "date-time" },
            estimatedHours: { type: "number" },
            actualHours: { type: "number" },
          },
        },
        Attendance: {
          type: "object",
          properties: {
            _id: { type: "string" },
            employee: { $ref: "#/components/schemas/Employee" },
            date: { type: "string", format: "date" },
            checkIn: {
              type: "object",
              properties: {
                time: { type: "string", format: "date-time" },
                location: {
                  type: "object",
                  properties: {
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    address: { type: "string" },
                  },
                },
              },
            },
            checkOut: {
              type: "object",
              properties: {
                time: { type: "string", format: "date-time" },
                location: {
                  type: "object",
                  properties: {
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    address: { type: "string" },
                  },
                },
              },
            },
            totalHours: { type: "number" },
            status: { type: "string", enum: ["present", "absent", "late", "half-day"] },
          },
        },
        Leave: {
          type: "object",
          properties: {
            _id: { type: "string" },
            employee: { $ref: "#/components/schemas/Employee" },
            type: { type: "string", enum: ["annual", "sick", "maternity", "paternity", "personal", "emergency"] },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            totalDays: { type: "number" },
            reason: { type: "string" },
            status: { type: "string", enum: ["pending", "approved", "rejected", "cancelled"] },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API files
}

const specs = swaggerJsdoc(options)

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))
  console.log("API Documentation available at /api-docs")
}

module.exports = { setupSwagger, specs }
